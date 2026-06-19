<?php

use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductBrand;
use App\Domains\Product\Models\ProductCategory;
use App\Enums\PriceListAdjustmentType;
use App\Enums\PriceListAppliesTo;
use App\Enums\PriceListCalculationMode;
use App\Events\BulkProductPricesUpdated;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    Sanctum::actingAs($this->user);
});

// ==========================================
// SHOW PRODUCT PRICING TESTS
// ==========================================

it('can get product pricing information', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
        'manufacturer_retail_price' => 150,
        'sale_markup_percent' => 50,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/products/{$product->id}/pricing");

    $response->assertSuccessful()
        ->assertJsonStructure([
            'success',
            'data' => [
                'product',
                'effective_price' => [
                    'sale_price',
                    'rental_daily',
                    'rental_weekly',
                    'rental_monthly',
                    'source',
                ],
            ],
        ]);
});

it('shows price from price list when available', function () {
    $product = Product::factory()->create([
        'purchase_price' => 100,
        'manufacturer_retail_price' => 150,
        'is_active' => true,
    ]);

    $priceList = PriceList::create([
        'name' => 'Special Prices',
        'code' => 'SPEC-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $product->id,
        'sale_price' => 200,
        'is_manual_price' => true,
        'rental_daily' => 20,
        'rental_weekly' => 100,
        'rental_monthly' => 300,
        'is_manual_rental' => false,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/products/{$product->id}/pricing?price_list_id={$priceList->id}");

    $response->assertSuccessful();

    expect($response->json('data.effective_price.sale_price'))->toBe(200.0);
    expect($response->json('data.effective_price.source'))->toBe('price_list');
    expect($response->json('data.effective_price.price_list_id'))->toBe($priceList->id);
});

it('falls back to manufacturer retail price when no price list', function () {
    $product = Product::factory()->create([
        'purchase_price' => 100,
        'manufacturer_retail_price' => 175.50,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/products/{$product->id}/pricing");

    $response->assertSuccessful();

    expect($response->json('data.effective_price.sale_price'))->toBe(175.5);
    expect($response->json('data.effective_price.source'))->toBe('manufacturer_msrp');
});

it('calculates price when no price list or manufacturer price', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
        'manufacturer_retail_price' => null,
        'sale_markup_percent' => 30,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/products/{$product->id}/pricing");

    $response->assertSuccessful();

    expect($response->json('data.effective_price.source'))->toBe('calculated');
    // Should be roughly 100 * 1.3 = 130
    expect($response->json('data.effective_price.sale_price'))->toBeGreaterThan(100);
});

it('requires authorization to view product pricing', function () {
    $product = Product::factory()->create();

    $workerUser = User::factory()->create();
    $workerUser->assignRole('worker');
    Sanctum::actingAs($workerUser);

    $response = $this->getJson("/api/v1/products/{$product->id}/pricing");

    // Workers should be able to view prices (read-only)
    $response->assertSuccessful();
});

it('requires authentication to view product pricing', function () {
    Sanctum::actingAs(null);

    $product = Product::factory()->create();

    $response = $this->getJson("/api/v1/products/{$product->id}/pricing");

    $response->assertUnauthorized();
});

// ==========================================
// BULK UPDATE PRICES TESTS
// ==========================================

it('can bulk update prices with percentage adjustment', function () {
    Event::fake([BulkProductPricesUpdated::class]);

    $brand = ProductBrand::factory()->create();

    Product::factory()->count(3)->create([
        'brand_id' => $brand->id,
        'manufacturer_retail_price' => 100,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/products/pricing/bulk-update', [
        'filters' => [
            'brand_id' => $brand->id,
        ],
        'adjustment' => [
            'type' => 'percentage',
            'value' => 10,
        ],
    ]);

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'data' => [
                'updated_count' => 3,
            ],
        ]);

    // Check prices were updated to 110 (100 + 10%)
    $products = Product::where('brand_id', $brand->id)->get();
    foreach ($products as $product) {
        expect((float) $product->manufacturer_retail_price)->toBe(110.0);
    }

    Event::assertDispatched(BulkProductPricesUpdated::class);
});

it('can bulk update prices with fixed adjustment', function () {
    $category = ProductCategory::factory()->create();

    Product::factory()->count(2)->create([
        'category_id' => $category->id,
        'manufacturer_retail_price' => 100,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/products/pricing/bulk-update', [
        'filters' => [
            'category_id' => $category->id,
        ],
        'adjustment' => [
            'type' => 'fixed',
            'value' => 25,
        ],
    ]);

    $response->assertSuccessful();

    // Check prices were updated to 125 (100 + 25)
    $products = Product::where('category_id', $category->id)->get();
    foreach ($products as $product) {
        expect((float) $product->manufacturer_retail_price)->toBe(125.0);
    }
});

it('can bulk update prices with negative adjustment', function () {
    Product::factory()->count(2)->create([
        'manufacturer_retail_price' => 100,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/products/pricing/bulk-update', [
        'filters' => [],
        'adjustment' => [
            'type' => 'percentage',
            'value' => -10, // 10% discount
        ],
    ]);

    $response->assertSuccessful();

    // Check prices were reduced to 90 (100 - 10%)
    $products = Product::active()->get();
    foreach ($products as $product) {
        expect((float) $product->manufacturer_retail_price)->toBe(90.0);
    }
});

it('only updates active products in bulk update', function () {
    Product::factory()->create([
        'manufacturer_retail_price' => 100,
        'is_active' => true,
    ]);

    Product::factory()->create([
        'manufacturer_retail_price' => 100,
        'is_active' => false,
    ]);

    $response = $this->postJson('/api/v1/products/pricing/bulk-update', [
        'filters' => [],
        'adjustment' => [
            'type' => 'percentage',
            'value' => 20,
        ],
    ]);

    $response->assertSuccessful()
        ->assertJson([
            'data' => [
                'updated_count' => 1, // Only active product
            ],
        ]);
});

it('can filter bulk update by brand code', function () {
    $brand = Brand::factory()->create(['code' => 'BTICINO']);

    Product::factory()->count(2)->create([
        'brand_id' => $brand->id,
        'manufacturer_retail_price' => 100,
        'is_active' => true,
    ]);

    Product::factory()->create([
        'manufacturer_retail_price' => 100,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/products/pricing/bulk-update', [
        'filters' => [
            'brand_code' => 'BTICINO',
        ],
        'adjustment' => [
            'type' => 'percentage',
            'value' => 15,
        ],
    ]);

    $response->assertSuccessful()
        ->assertJson([
            'data' => [
                'updated_count' => 2,
            ],
        ]);
});

it('requires permission to bulk update prices', function () {
    $workerUser = User::factory()->create();
    $workerUser->assignRole('worker');
    Sanctum::actingAs($workerUser);

    Product::factory()->create(['is_active' => true]);

    $response = $this->postJson('/api/v1/products/pricing/bulk-update', [
        'filters' => [],
        'adjustment' => [
            'type' => 'percentage',
            'value' => 10,
        ],
    ]);

    $response->assertForbidden();
});

// ==========================================
// PREVIEW ADJUSTMENT TESTS
// ==========================================

it('can preview price adjustment', function () {
    $category = ProductCategory::factory()->create();

    Product::factory()->create([
        'name' => 'Product A',
        'category_id' => $category->id,
        'manufacturer_cost_price' => 100,
        'manufacturer_retail_price' => 150,
        'sale_markup_percent' => 50,
        'is_active' => true,
    ]);

    Product::factory()->create([
        'name' => 'Product B',
        'category_id' => $category->id,
        'manufacturer_cost_price' => 200,
        'manufacturer_retail_price' => 300,
        'sale_markup_percent' => 50,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/products/pricing/preview-adjustment', [
        'filters' => [
            'category_id' => $category->id,
        ],
        'adjustment_type' => 'percentage',
        'adjustment_value' => 10,
    ]);

    $response->assertSuccessful()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'product_id',
                    'product_name',
                    'current_price',
                    'new_price',
                    'difference',
                    'difference_percent',
                ],
            ],
        ]);

    expect($response->json('data'))->toHaveCount(2);
});

it('preview shows correct price calculations', function () {
    $product = Product::factory()->create([
        'name' => 'Test Product',
        'manufacturer_cost_price' => 100,
        'sale_markup_percent' => 50,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/products/pricing/preview-adjustment', [
        'filters' => [],
        'adjustment_type' => 'percentage',
        'adjustment_value' => 20,
    ]);

    $response->assertSuccessful();

    $preview = $response->json('data.0');

    expect($preview['product_id'])->toBe($product->id);
    expect($preview['product_name'])->toBe('Test Product');
    expect($preview['difference_percent'])->toBe(20.0);
});

it('preview with fixed adjustment shows correct difference', function () {
    Product::factory()->create([
        'purchase_price' => 100,
        'markup_percentage' => 50,
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/products/pricing/preview-adjustment', [
        'filters' => [],
        'adjustment_type' => 'fixed',
        'adjustment_value' => 30,
    ]);

    $response->assertSuccessful();

    $preview = $response->json('data.0');

    expect($preview['difference'])->toBe(30.0);
});

it('preview requires authentication', function () {
    Sanctum::actingAs(null);

    Product::factory()->create(['is_active' => true]);

    $response = $this->postJson('/api/v1/products/pricing/preview-adjustment', [
        'filters' => [],
        'adjustment_type' => 'percentage',
        'adjustment_value' => 10,
    ]);

    $response->assertUnauthorized();
});

it('preview returns empty array when no products match filters', function () {
    $category = ProductCategory::factory()->create();

    Product::factory()->create(['is_active' => true]); // No category

    $response = $this->postJson('/api/v1/products/pricing/preview-adjustment', [
        'filters' => [
            'category_id' => $category->id,
        ],
        'adjustment_type' => 'percentage',
        'adjustment_value' => 10,
    ]);

    $response->assertSuccessful();

    expect($response->json('data'))->toBe([]);
});
