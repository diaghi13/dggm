<?php

use App\Domains\Product\Enums\ProductRelationQuantityType;
use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductRelationType;
use App\Domains\Product\Services\ProductPricingService;
use App\Enums\PriceListAdjustmentType;
use App\Enums\PriceListAppliesTo;
use App\Enums\PriceListCalculationMode;
use App\Jobs\RecalculateCompositePricesJob;
use App\Jobs\RecalculatePriceListItemsForProductJob;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\User;
use App\Services\RentalEngineService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
    $this->artisan('db:seed', ['--class' => 'ProductRelationTypeSeeder']);
    $this->artisan('db:seed', ['--class' => 'SettingSeeder']);

    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    Sanctum::actingAs($this->user);
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

function makeTestArticle(array $overrides = []): Product
{
    return Product::create(array_merge([
        'code' => 'ART-'.uniqid(),
        'name' => 'Test Article',
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'standard_cost' => 100.0,
        'manufacturer_cost_price' => 100.0,
        'manufacturer_retail_price' => 150.0,
        'sale_markup_percent' => 0,
        'is_active' => true,
        'is_rentable' => true,
    ], $overrides));
}

function makeTestComposite(array $overrides = []): Product
{
    return Product::create(array_merge([
        'code' => 'COMP-'.uniqid(),
        'name' => 'Test Composite',
        'product_type' => ProductType::COMPOSITE,
        'unit' => 'pz',
        'is_active' => true,
    ], $overrides));
}

function addTestComponentRelation(Product $composite, Product $component, float $quantity = 1.0): void
{
    $componentType = ProductRelationType::where('code', 'component')->firstOrFail();

    $composite->relations()->create([
        'related_product_id' => $component->id,
        'relation_type_id' => $componentType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => (string) $quantity,
        'is_visible_in_quote' => true,
        'is_visible_in_material_list' => true,
        'is_required_for_stock' => true,
        'is_optional' => false,
        'sort_order' => 0,
    ]);
}

function makeDefaultPriceList(string $suffix = ''): PriceList
{
    return PriceList::create([
        'name' => 'Default List '.$suffix,
        'code' => 'DEF-'.uniqid(),
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
        'is_default' => true,
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductPricingService::calculateCompositePrices()
// ─────────────────────────────────────────────────────────────────────────────

it('returns zero prices for non-composite product', function () {
    $article = makeTestArticle();
    $service = app(ProductPricingService::class);

    $prices = $service->calculateCompositePrices($article);

    expect($prices['sale_price'])->toBe(0.0)
        ->and($prices['standard_cost'])->toBe(0.0)
        ->and($prices['components_count'])->toBe(0);
});

it('returns zero prices for composite with no components', function () {
    $composite = makeTestComposite();
    $service = app(ProductPricingService::class);

    $prices = $service->calculateCompositePrices($composite);

    expect($prices['sale_price'])->toBe(0.0)
        ->and($prices['standard_cost'])->toBe(0.0)
        ->and($prices['components_count'])->toBe(0);
});

it('sums standard_cost from components weighted by quantity', function () {
    $comp1 = makeTestArticle(['standard_cost' => 50.0]);
    $comp2 = makeTestArticle(['standard_cost' => 30.0]);
    $composite = makeTestComposite();

    addTestComponentRelation($composite, $comp1, 2.0); // 50 × 2 = 100
    addTestComponentRelation($composite, $comp2, 1.0); // 30 × 1 = 30

    $service = app(ProductPricingService::class);
    $prices = $service->calculateCompositePrices($composite);

    expect($prices['standard_cost'])->toBe(130.0)
        ->and($prices['components_count'])->toBe(2);
});

it('sums calculated sale_price from components when no price list exists', function () {
    // Markup 0% → sale_price = manufacturer_cost_price
    $comp1 = makeTestArticle(['manufacturer_cost_price' => 100.0, 'sale_markup_percent' => 0]);
    $comp2 = makeTestArticle(['manufacturer_cost_price' => 200.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();

    addTestComponentRelation($composite, $comp1, 1.0); // 100
    addTestComponentRelation($composite, $comp2, 2.0); // 200 × 2 = 400

    $service = app(ProductPricingService::class);
    $prices = $service->calculateCompositePrices($composite);

    expect($prices['sale_price'])->toBe(500.0);
});

it('prefers price list item sale_price over calculated price for components', function () {
    $component = makeTestArticle(['manufacturer_cost_price' => 100.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();

    $priceList = makeDefaultPriceList();

    PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $component->id,
        'sale_price' => 250.0,
        'is_manual_price' => true,
        'rental_daily' => 25.0,
        'rental_weekly' => 100.0,
        'rental_monthly' => 300.0,
        'rental_hourly' => 3.13,
        'rental_half_day' => 17.5,
        'rental_seasonal' => 750.0,
        'is_manual_rental' => false,
        'is_active' => true,
    ]);

    addTestComponentRelation($composite, $component, 1.0);

    $service = app(ProductPricingService::class);
    $prices = $service->calculateCompositePrices($composite);

    expect($prices['sale_price'])->toBe(250.0)
        ->and($prices['rental_daily'])->toBe(25.0)
        ->and($prices['rental_weekly'])->toBe(100.0)
        ->and($prices['rental_monthly'])->toBe(300.0);
});

it('estimates rental prices when component has no rental price list values', function () {
    $component = makeTestArticle(['manufacturer_cost_price' => 100.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();

    $priceList = makeDefaultPriceList();

    // Price list item without rental prices
    PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $component->id,
        'sale_price' => 100.0,
        'is_manual_price' => true,
        'rental_daily' => null,
        'is_manual_rental' => false,
        'is_active' => true,
    ]);

    addTestComponentRelation($composite, $component, 1.0);

    $service = app(ProductPricingService::class);
    $prices = $service->calculateCompositePrices($composite);

    // rental_daily should be estimated (non-zero)
    expect($prices['rental_daily'])->toBeGreaterThan(0.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Product::calculateCompositeSalePrice()
// ─────────────────────────────────────────────────────────────────────────────

it('calculateCompositeSalePrice returns 0 for non-composite', function () {
    $article = makeTestArticle();
    expect($article->calculateCompositeSalePrice())->toBe(0.0);
});

it('calculateCompositeSalePrice sums component prices', function () {
    $comp1 = makeTestArticle(['manufacturer_cost_price' => 100.0, 'sale_markup_percent' => 0]);
    $comp2 = makeTestArticle(['manufacturer_cost_price' => 50.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();

    addTestComponentRelation($composite, $comp1, 1.0); // 100
    addTestComponentRelation($composite, $comp2, 2.0); // 50 × 2 = 100

    expect($composite->calculateCompositeSalePrice())->toBe(200.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// API: GET /products/{id}/composite-breakdown
// ─────────────────────────────────────────────────────────────────────────────

it('composite-breakdown returns 422 for non-composite product', function () {
    $article = makeTestArticle();

    $this->getJson("/api/v1/products/{$article->id}/composite-breakdown")
        ->assertStatus(422);
});

it('composite-breakdown returns full breakdown structure', function () {
    $comp1 = makeTestArticle(['manufacturer_cost_price' => 100.0, 'standard_cost' => 80.0, 'sale_markup_percent' => 0]);
    $comp2 = makeTestArticle(['manufacturer_cost_price' => 50.0, 'standard_cost' => 40.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();

    addTestComponentRelation($composite, $comp1, 1.0);
    addTestComponentRelation($composite, $comp2, 2.0);

    $response = $this->getJson("/api/v1/products/{$composite->id}/composite-breakdown");

    $response->assertSuccessful()
        ->assertJsonStructure([
            'success',
            'data' => [
                'product_id',
                'product_code',
                'product_name',
                'components' => [
                    '*' => [
                        'relation_id',
                        'component_product_id',
                        'component_code',
                        'component_name',
                        'quantity',
                        'unit_standard_cost',
                        'unit_sale_price',
                        'line_standard_cost',
                        'line_sale_price',
                        'price_source',
                    ],
                ],
                'totals' => [
                    'standard_cost',
                    'sale_price',
                    'rental_daily',
                    'components_count',
                ],
            ],
        ]);

    $data = $response->json('data');
    expect($data['components'])->toHaveCount(2)
        ->and((float) $data['totals']['standard_cost'])->toBe(160.0) // 80×1 + 40×2
        ->and((float) $data['totals']['sale_price'])->toBe(200.0);  // 100×1 + 50×2
});

// ─────────────────────────────────────────────────────────────────────────────
// API: POST /products/{id}/calculate-price
// ─────────────────────────────────────────────────────────────────────────────

it('calculate-price endpoint returns correct sale_price for composite', function () {
    $comp = makeTestArticle(['manufacturer_cost_price' => 100.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();
    addTestComponentRelation($composite, $comp, 1.0);

    $response = $this->postJson("/api/v1/products/{$composite->id}/calculate-price");

    $response->assertSuccessful()
        ->assertJsonStructure([
            'success',
            'data' => ['sale_price', 'cost', 'margin', 'margin_percentage'],
        ]);

    expect((float) $response->json('data.sale_price'))->toBe(100.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// RecalculateCompositePricesJob
// ─────────────────────────────────────────────────────────────────────────────

it('RecalculateCompositePricesJob updates composite standard_cost', function () {
    $component = makeTestArticle(['standard_cost' => 50.0, 'manufacturer_cost_price' => 50.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite(['standard_cost' => 0.0]);
    addTestComponentRelation($composite, $component, 2.0);

    (new RecalculateCompositePricesJob($component->id))->handle(
        app(ProductPricingService::class),
        app(RentalEngineService::class)
    );

    $composite->refresh();
    expect((float) $composite->standard_cost)->toBe(100.0); // 50 × 2
});

it('RecalculateCompositePricesJob updates non-manual price list items of composite', function () {
    $component = makeTestArticle(['manufacturer_cost_price' => 100.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();
    addTestComponentRelation($composite, $component, 1.0);

    $priceList = makeDefaultPriceList();

    $item = PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $composite->id,
        'sale_price' => 0.0,
        'is_manual_price' => false,
        'is_manual_rental' => false,
        'is_active' => true,
    ]);

    (new RecalculateCompositePricesJob($component->id))->handle(
        app(ProductPricingService::class),
        app(RentalEngineService::class)
    );

    $item->refresh();
    expect((float) $item->sale_price)->toBe(100.0);
});

it('RecalculateCompositePricesJob does not touch fully manual price list items', function () {
    $component = makeTestArticle(['manufacturer_cost_price' => 100.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();
    addTestComponentRelation($composite, $component, 1.0);

    $priceList = makeDefaultPriceList();

    $manualItem = PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $composite->id,
        'sale_price' => 999.0,
        'is_manual_price' => true,
        'is_manual_rental' => true,
        'is_active' => true,
    ]);

    (new RecalculateCompositePricesJob($component->id))->handle(
        app(ProductPricingService::class),
        app(RentalEngineService::class)
    );

    $manualItem->refresh();
    expect((float) $manualItem->sale_price)->toBe(999.0);
});

it('ProductCostUpdated event queues UpdateCompositePricesFromComponentListener', function () {
    Queue::fake();

    $component = makeTestArticle();
    \App\Domains\Product\Events\ProductCostUpdated::dispatch($component, ['trigger' => 'test']);

    // ShouldQueue listeners are pushed as CallQueuedListener jobs internally.
    // Use Queue::listenersPushed() to assert the queued listener was dispatched.
    $pushed = Queue::listenersPushed(\App\Listeners\UpdateCompositePricesFromComponentListener::class);
    expect($pushed)->not->toBeEmpty();
});

// ─────────────────────────────────────────────────────────────────────────────
// UpdateProductAction: composite recalculation
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Bug regression: UpdateProductAction must NOT wipe relations on partial update
// ─────────────────────────────────────────────────────────────────────────────

it('UpdateProductAction does NOT delete relations when payload omits the relations key (Bug 1)', function () {
    Queue::fake();

    $comp1 = makeTestArticle(['standard_cost' => 50.0]);
    $composite = makeTestComposite(['standard_cost' => 50.0]);
    addTestComponentRelation($composite, $comp1, 1.0);

    expect($composite->relations()->count())->toBe(1);

    // Simulate "Apply Calculated Price" from the frontend:
    // payload only contains code, name, product_type, standard_cost — NO relations key.
    $data = \App\Domains\Product\Data\ProductData::from([
        'id' => $composite->id,
        'code' => $composite->code,
        'name' => $composite->name,
        'product_type' => 'composite',
        'standard_cost' => 99.0,
    ]);

    $action = app(\App\Domains\Product\Actions\UpdateProductAction::class);
    $action->execute($composite, $data);

    // Relations must still exist after the partial update
    expect($composite->fresh()->relations()->count())->toBe(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug regression: generateAutomaticPriceListItem must use composite prices
// ─────────────────────────────────────────────────────────────────────────────

it('generateAutomaticPriceListItem returns non-zero sale_price for composite with components (Bug 2)', function () {
    $comp1 = makeTestArticle(['manufacturer_cost_price' => 100.0, 'sale_markup_percent' => 0]);
    $comp2 = makeTestArticle(['manufacturer_cost_price' => 50.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();

    addTestComponentRelation($composite, $comp1, 1.0); // sale 100
    addTestComponentRelation($composite, $comp2, 2.0); // sale 50 × 2 = 100 → total 200

    $priceList = PriceList::create([
        'name' => 'Test List',
        'code' => 'TEST-'.uniqid(),
        'calculation_mode' => \App\Enums\PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => \App\Enums\PriceListAppliesTo::Both,
        'is_active' => true,
        'is_default' => false,
    ]);

    $service = app(ProductPricingService::class);
    $result = $service->generateAutomaticPriceListItem($composite, $priceList);

    expect($result['sale_price'])->toBe(200.0)
        ->and($result['is_manual_price'])->toBeFalse();
});

it('generateManualPriceListItem returns non-zero sale_price for composite with components (Bug 2)', function () {
    $comp1 = makeTestArticle(['manufacturer_cost_price' => 150.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();

    addTestComponentRelation($composite, $comp1, 1.0);

    $service = app(ProductPricingService::class);
    $result = $service->generateManualPriceListItem($composite);

    expect($result['sale_price'])->toBe(150.0)
        ->and($result['is_manual_price'])->toBeTrue();
});

it('RecalculatePriceListItemsForProductJob sets non-zero sale_price for composite price list items (Bug 2)', function () {
    $comp = makeTestArticle(['manufacturer_cost_price' => 200.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite();
    addTestComponentRelation($composite, $comp, 1.0);

    $priceList = makeDefaultPriceList('bug2');

    $item = PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $composite->id,
        'sale_price' => 0.0,
        'is_manual_price' => false,
        'is_manual_rental' => false,
        'is_active' => true,
    ]);

    // Directly dispatch the job for the composite itself
    (new \App\Jobs\RecalculatePriceListItemsForProductJob($composite->id))->handle(
        app(\App\Services\PriceCalculatorService::class),
        app(ProductPricingService::class),
        app(\App\Services\RentalEngineService::class)
    );

    $item->refresh();
    expect((float) $item->sale_price)->toBe(200.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// UpdateProductAction: composite recalculation
// ─────────────────────────────────────────────────────────────────────────────

it('UpdateProductAction recalculates standard_cost when composite relations are synced', function () {
    Queue::fake();

    $comp1 = makeTestArticle(['standard_cost' => 80.0, 'manufacturer_cost_price' => 80.0, 'sale_markup_percent' => 0]);
    $composite = makeTestComposite(['standard_cost' => 0.0]);

    $componentType = ProductRelationType::where('code', 'component')->firstOrFail();

    $data = \App\Domains\Product\Data\ProductData::from([
        'code' => $composite->code,
        'name' => $composite->name,
        'product_type' => 'composite',
        'unit' => 'pz',
        'is_active' => true,
        'relations' => [
            [
                'product_id' => $composite->id,
                'related_product_id' => $comp1->id,
                'relation_type_id' => $componentType->id,
                'quantity_type' => ProductRelationQuantityType::MULTIPLIED->value,
                'quantity_value' => '2',
                'is_visible_in_quote' => true,
                'is_visible_in_material_list' => true,
                'is_required_for_stock' => true,
                'is_optional' => false,
                'sort_order' => 0,
            ],
        ],
    ]);

    $action = app(\App\Domains\Product\Actions\UpdateProductAction::class);
    $updated = $action->execute($composite, $data);

    // standard_cost = 80 × 2 = 160
    expect((float) $updated->standard_cost)->toBe(160.0);

    Queue::assertPushed(RecalculatePriceListItemsForProductJob::class);
});
