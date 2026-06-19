<?php

use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Services\ProductPricingService;
use App\Enums\PriceListAdjustmentType;
use App\Enums\PriceListAppliesTo;
use App\Enums\PriceListCalculationMode;
use App\Jobs\RecalculatePriceListItemsForProductJob;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\User;
use App\Services\PriceCalculatorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeServiceProduct(array $overrides = []): Product
{
    return Product::create(array_merge([
        'code' => 'SVC-'.uniqid(),
        'name' => 'Test Service',
        'product_type' => ProductType::SERVICE,
        'unit' => 'ora',
        'is_active' => true,
        'is_rentable' => false,
        'sale_markup_percent' => 30,
    ], $overrides));
}

function makeAutomaticPriceList(string $suffix = ''): PriceList
{
    return PriceList::create([
        'name' => 'Auto List '.$suffix,
        'code' => 'AUTO-'.uniqid(),
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
        'is_default' => true,
        'adjustment_value' => null,
    ]);
}

function makeManualPriceList(string $suffix = ''): PriceList
{
    return PriceList::create([
        'name' => 'Manual List '.$suffix,
        'code' => 'MAN-'.uniqid(),
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
        'is_default' => false,
        'adjustment_value' => null,
    ]);
}

beforeEach(function () {
    $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
    $this->artisan('db:seed', ['--class' => 'SettingSeeder']);

    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    Sanctum::actingAs($this->user);
});

// ─────────────────────────────────────────────────────────────────────────────
// ProductPricingService::generateAutomaticPriceListItem()
// ─────────────────────────────────────────────────────────────────────────────

it('generateAutomaticPriceListItem returns NULL rental fields for SERVICE', function () {
    $service = makeServiceProduct(['standard_cost' => 50.0]);
    $priceList = makeAutomaticPriceList();

    $pricing = app(ProductPricingService::class);
    $item = $pricing->generateAutomaticPriceListItem($service, $priceList);

    expect($item['rental_hourly'])->toBeNull()
        ->and($item['rental_half_day'])->toBeNull()
        ->and($item['rental_daily'])->toBeNull()
        ->and($item['rental_weekly'])->toBeNull()
        ->and($item['rental_monthly'])->toBeNull()
        ->and($item['rental_seasonal'])->toBeNull()
        ->and($item['is_manual_rental'])->toBeFalse()
        ->and($item['sale_price'])->toBeGreaterThan(0)
        ->and($item['is_manual_price'])->toBeFalse();
});

// ─────────────────────────────────────────────────────────────────────────────
// ProductPricingService::generateManualPriceListItem()
// ─────────────────────────────────────────────────────────────────────────────

it('generateManualPriceListItem returns NULL rental fields for SERVICE', function () {
    $service = makeServiceProduct(['standard_cost' => 80.0]);

    $pricing = app(ProductPricingService::class);
    $item = $pricing->generateManualPriceListItem($service);

    expect($item['rental_hourly'])->toBeNull()
        ->and($item['rental_half_day'])->toBeNull()
        ->and($item['rental_daily'])->toBeNull()
        ->and($item['rental_weekly'])->toBeNull()
        ->and($item['rental_monthly'])->toBeNull()
        ->and($item['rental_seasonal'])->toBeNull()
        ->and($item['is_manual_rental'])->toBeFalse()
        ->and($item['sale_price'])->toBeGreaterThan(0)
        ->and($item['is_manual_price'])->toBeTrue();
});

// ─────────────────────────────────────────────────────────────────────────────
// PriceCalculatorService::calculateProductSalePrice()
// ─────────────────────────────────────────────────────────────────────────────

it('calculateProductSalePrice returns standard_cost directly for SERVICE with no manufacturer cost (no markup applied)', function () {
    // standard_cost = 250 is the final selling price — markup must NOT be applied
    $service = makeServiceProduct([
        'standard_cost' => 250.0,
        'manufacturer_cost_price' => null,
        'sale_markup_percent' => 30,
    ]);

    $calculator = app(PriceCalculatorService::class);
    $price = $calculator->calculateProductSalePrice($service);

    // 250, NOT 325 (250 * 1.30) — standard_cost is already the final price
    expect($price)->toBe(250.0);
});

it('calculateProductSalePrice applies markup to manufacturer_cost_price for SERVICE (cost basis)', function () {
    // manufacturer_cost_price = cost basis → markup IS applied
    $service = makeServiceProduct([
        'standard_cost' => 0.0,
        'manufacturer_cost_price' => 100.0,
        'sale_markup_percent' => 30,
    ]);

    $calculator = app(PriceCalculatorService::class);
    $price = $calculator->calculateProductSalePrice($service);

    // 100 * 1.30 = 130.00 — manufacturer_cost_price is a cost, markup applies
    expect($price)->toBe(130.0);
});

it('calculateProductSalePrice prefers manufacturer_cost_price over standard_cost for SERVICE', function () {
    // When both are set, manufacturer_cost_price + markup takes priority
    $service = makeServiceProduct([
        'standard_cost' => 250.0,
        'manufacturer_cost_price' => 100.0,
        'sale_markup_percent' => 30,
    ]);

    $calculator = app(PriceCalculatorService::class);
    $price = $calculator->calculateProductSalePrice($service);

    // 100 * 1.30 = 130.00 (manufacturer_cost_price branch wins)
    expect($price)->toBe(130.0);
});

it('calculateProductSalePrice returns 0.0 and logs warning for SERVICE with no cost', function () {
    $service = makeServiceProduct([
        'standard_cost' => 0.0,
        'manufacturer_cost_price' => null,
        'sale_markup_percent' => 30,
    ]);

    Log::shouldReceive('warning')
        ->once()
        ->withArgs(fn ($msg) => str_contains($msg, 'SERVICE product') && str_contains($msg, 'no cost basis'));

    $calculator = app(PriceCalculatorService::class);
    $price = $calculator->calculateProductSalePrice($service);

    expect($price)->toBe(0.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// RecalculatePriceListItemsForProductJob — SERVICE product
// ─────────────────────────────────────────────────────────────────────────────

it('RecalculatePriceListItemsForProductJob sets rental fields to NULL for SERVICE products', function () {
    $service = makeServiceProduct(['standard_cost' => 75.0]);
    $priceList = makeManualPriceList('job-test');

    // Create a price list item with non-null rental values that should be cleared
    $item = PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $service->id,
        'sale_price' => 100.0,
        'is_manual_price' => false,
        'is_manual_rental' => false,
        'rental_hourly' => 5.0,
        'rental_half_day' => 20.0,
        'rental_daily' => 35.0,
        'rental_weekly' => 200.0,
        'rental_monthly' => 600.0,
        'rental_seasonal' => 1200.0,
        'is_active' => true,
    ]);

    (new RecalculatePriceListItemsForProductJob($service->id))->handle(
        app(\App\Services\PriceCalculatorService::class),
        app(\App\Domains\Product\Services\ProductPricingService::class),
        app(\App\Services\RentalEngineService::class)
    );

    $item->refresh();

    expect($item->rental_hourly)->toBeNull()
        ->and($item->rental_half_day)->toBeNull()
        ->and($item->rental_daily)->toBeNull()
        ->and($item->rental_weekly)->toBeNull()
        ->and($item->rental_monthly)->toBeNull()
        ->and($item->rental_seasonal)->toBeNull();
});

// ─────────────────────────────────────────────────────────────────────────────
// PriceListItemController::store() — SERVICE product via API
// ─────────────────────────────────────────────────────────────────────────────

it('price list item created for SERVICE via API has NULL rental fields', function () {
    $service = makeServiceProduct(['standard_cost' => 60.0]);
    $priceList = makeManualPriceList('api-test');

    $response = $this->postJson("/api/v1/price-lists/{$priceList->id}/items", [
        'product_id' => $service->id,
        'sale_price' => 78.0,
        'rental_hourly' => 4.5,   // should be forced to null
        'rental_daily' => 30.0,   // should be forced to null
        'is_manual_rental' => true,
        'is_active' => true,
    ]);

    $response->assertCreated();

    $data = $response->json('data');
    expect($data['rental_hourly'])->toBeNull()
        ->and($data['rental_half_day'])->toBeNull()
        ->and($data['rental_daily'])->toBeNull()
        ->and($data['rental_weekly'])->toBeNull()
        ->and($data['rental_monthly'])->toBeNull()
        ->and($data['rental_seasonal'])->toBeNull();
});
