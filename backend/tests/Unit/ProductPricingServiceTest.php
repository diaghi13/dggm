<?php

use App\Domains\Product\Models\Product;
use App\Domains\Product\Services\ProductPricingService;
use App\Enums\PriceListAdjustmentType;
use App\Enums\PriceListAppliesTo;
use App\Enums\PriceListCalculationMode;
use App\Models\PriceList;
use App\Models\PriceListItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(ProductPricingService::class);
});

// ==========================================
// CALCULATE AUTOMATIC PRICE TESTS
// ==========================================

it('calculates automatic price with percentage adjustment', function () {
    // Must be article: composites derive price from components (none here → 0)
    $product = Product::factory()->article()->create([
        'manufacturer_cost_price' => 100,
        'sale_markup_percent' => 50, // Base sale price = 150
    ]);

    $priceList = PriceList::create([
        'name' => 'Test Price List',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::Percentage,
        'adjustment_value' => 10, // +10% on 150 = 165
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    $price = $this->service->calculateAutomaticPrice($product, $priceList);

    expect($price)->toBe(165.0);
});

it('calculates automatic price with fixed adjustment', function () {
    // Must be article: composites derive price from components (none here → 0)
    $product = Product::factory()->article()->create([
        'manufacturer_cost_price' => 100,
        'sale_markup_percent' => 50, // Base sale price = 150
    ]);

    $priceList = PriceList::create([
        'name' => 'Test Price List',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::Fixed,
        'adjustment_value' => 25, // +25 on 150 = 175
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    $price = $this->service->calculateAutomaticPrice($product, $priceList);

    expect($price)->toBe(175.0);
});

it('calculates automatic price with no adjustment', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
        'sale_markup_percent' => 40, // Base sale price = 140
    ]);

    $priceList = PriceList::create([
        'name' => 'Test Price List',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    $price = $this->service->calculateAutomaticPrice($product, $priceList);

    expect($price)->toBe(140.0);
});

it('calculates automatic price with negative adjustment', function () {
    // Must be article: composites derive price from components (none here → 0)
    $product = Product::factory()->article()->create([
        'manufacturer_cost_price' => 100,
        'sale_markup_percent' => 50, // Base sale price = 150
    ]);

    $priceList = PriceList::create([
        'name' => 'Discount Price List',
        'code' => 'DISC-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::Percentage,
        'adjustment_value' => -20, // -20% on 150 = 120
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    $price = $this->service->calculateAutomaticPrice($product, $priceList);

    expect($price)->toBe(120.0);
});

// ==========================================
// GENERATE AUTOMATIC PRICE LIST ITEM TESTS
// ==========================================

it('generates automatic price list item with all fields', function () {
    $product = Product::factory()->create([
        'purchase_price' => 100,
        'markup_percentage' => 50,
    ]);

    $priceList = PriceList::create([
        'name' => 'Test Price List',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::Percentage,
        'adjustment_value' => 10,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    $itemData = $this->service->generateAutomaticPriceListItem($product, $priceList);

    expect($itemData)->toBeArray();
    expect($itemData)->toHaveKeys([
        'sale_price',
        'is_manual_price',
        'rental_daily',
        'rental_weekly',
        'rental_monthly',
        'is_manual_rental',
        'is_active',
    ]);

    expect($itemData['sale_price'])->toBe(165.0); // (100 * 1.5) * 1.1
    expect($itemData['is_manual_price'])->toBeFalse();
    expect($itemData['is_manual_rental'])->toBeFalse();
    expect($itemData['is_active'])->toBeTrue();
    expect($itemData['rental_daily'])->toBeGreaterThan(0);
});

it('generates rental prices based on sale price', function () {
    // Must be article: composites derive price from components (none here → 0)
    $product = Product::factory()->article()->create([
        'manufacturer_cost_price' => 300,
        'sale_markup_percent' => 0,
    ]);

    $priceList = PriceList::create([
        'name' => 'Test Price List',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    $itemData = $this->service->generateAutomaticPriceListItem($product, $priceList);

    // Rental prices should be calculated from sale price
    expect($itemData['rental_daily'])->toBeGreaterThan(0);
    expect($itemData['rental_weekly'])->toBeGreaterThan($itemData['rental_daily']);
    expect($itemData['rental_monthly'])->toBeGreaterThan($itemData['rental_weekly']);
});

// ==========================================
// GENERATE MANUAL PRICE LIST ITEM TESTS
// ==========================================

it('generates manual price list item', function () {
    $product = Product::factory()->create([
        'purchase_price' => 100,
        'markup_percentage' => 50,
    ]);

    $itemData = $this->service->generateManualPriceListItem($product);

    expect($itemData)->toBeArray();
    expect($itemData['sale_price'])->toBe(150.0); // Starting point: calculated price
    expect($itemData['is_manual_price'])->toBeTrue(); // Manual mode
    expect($itemData['is_manual_rental'])->toBeFalse();
    expect($itemData['is_active'])->toBeTrue();
});

it('manual item uses calculated price as starting point', function () {
    // Must be article: composites derive price from components (none here → 0)
    $product = Product::factory()->article()->create([
        'manufacturer_cost_price' => 200,
        'sale_markup_percent' => 25,
    ]);

    $itemData = $this->service->generateManualPriceListItem($product);

    // Should start with calculated price (200 * 1.25 = 250)
    expect($itemData['sale_price'])->toBe(250.0);
    expect($itemData['is_manual_price'])->toBeTrue(); // But flagged as manual
});

// ==========================================
// GET EFFECTIVE PRICE TESTS
// ==========================================

it('returns price from active price list item', function () {
    $product = Product::factory()->create([
        'purchase_price' => 100,
        'manufacturer_retail_price' => 200,
    ]);

    $priceList = PriceList::create([
        'name' => 'Active List',
        'code' => 'ACT-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $product->id,
        'sale_price' => 175,
        'is_manual_price' => true,
        'rental_daily' => 15,
        'rental_weekly' => 75,
        'rental_monthly' => 225,
        'is_active' => true,
    ]);

    $effectivePrice = $this->service->getEffectivePrice($product, $priceList);

    expect($effectivePrice['sale_price'])->toBe(175.0);
    expect($effectivePrice['source'])->toBe('price_list');
    expect($effectivePrice['price_list_id'])->toBe($priceList->id);
    expect($effectivePrice['rental_daily'])->toBe(15.0);
});

it('falls back to manufacturer retail price when no price list', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
        'manufacturer_retail_price' => 189.99,
    ]);

    $effectivePrice = $this->service->getEffectivePrice($product, null);

    expect($effectivePrice['sale_price'])->toBe(189.99);
    expect($effectivePrice['source'])->toBe('manufacturer_msrp');
    expect($effectivePrice['price_list_id'])->toBeNull();
});

it('calculates price when no price list or manufacturer price', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
        'manufacturer_retail_price' => null,
        'sale_markup_percent' => 60,
    ]);

    $effectivePrice = $this->service->getEffectivePrice($product, null);

    expect($effectivePrice['sale_price'])->toBe(160.0); // Calculated
    expect($effectivePrice['source'])->toBe('calculated');
    expect($effectivePrice['price_list_id'])->toBeNull();
});

it('ignores inactive price list items', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
        'manufacturer_retail_price' => 150,
    ]);

    $priceList = PriceList::create([
        'name' => 'Test List',
        'code' => 'TEST-001',
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
        'is_active' => false, // Inactive
    ]);

    $effectivePrice = $this->service->getEffectivePrice($product, $priceList);

    // Should fall back to manufacturer price since item is inactive
    expect($effectivePrice['sale_price'])->toBe(150.0);
    expect($effectivePrice['source'])->toBe('manufacturer_msrp');
});

// ==========================================
// GET DEFAULT PRICE LIST TESTS
// ==========================================

it('returns default active price list', function () {
    PriceList::create([
        'name' => 'Not Default',
        'code' => 'ND-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
        'is_default' => false,
    ]);

    $defaultList = PriceList::create([
        'name' => 'Default List',
        'code' => 'DEF-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
        'is_default' => true,
    ]);

    $result = $this->service->getDefaultPriceList();

    expect($result)->not->toBeNull();
    expect($result->id)->toBe($defaultList->id);
});

it('returns null when no default price list', function () {
    PriceList::create([
        'name' => 'Not Default',
        'code' => 'ND-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
        'is_default' => false,
    ]);

    $result = $this->service->getDefaultPriceList();

    expect($result)->toBeNull();
});

it('returns null when default list is inactive', function () {
    PriceList::create([
        'name' => 'Inactive Default',
        'code' => 'DEF-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => false, // Inactive
        'is_default' => true,
    ]);

    $result = $this->service->getDefaultPriceList();

    expect($result)->toBeNull();
});

// ==========================================
// SHOULD REGENERATE ITEM TESTS
// ==========================================

it('should regenerate automatic price items', function () {
    $item = new PriceListItem([
        'is_manual_price' => false,
    ]);

    expect($this->service->shouldRegenerateItem($item))->toBeTrue();
});

it('should not regenerate manual price items', function () {
    $item = new PriceListItem([
        'is_manual_price' => true,
    ]);

    expect($this->service->shouldRegenerateItem($item))->toBeFalse();
});

// ==========================================
// PREVIEW PRICE ADJUSTMENT TESTS
// ==========================================

it('previews percentage adjustment correctly', function () {
    $products = collect([
        Product::factory()->make([
            'id' => 1,
            'name' => 'Product A',
            'manufacturer_cost_price' => 100,
            'sale_markup_percent' => 50, // Sale price = 150
        ]),
        Product::factory()->make([
            'id' => 2,
            'name' => 'Product B',
            'manufacturer_cost_price' => 200,
            'sale_markup_percent' => 25, // Sale price = 250
        ]),
    ]);

    $preview = $this->service->previewPriceAdjustment($products, 'percentage', 10);

    expect($preview)->toHaveCount(2);

    expect($preview[0]['product_id'])->toBe(1);
    expect($preview[0]['current_price'])->toBe(150.0);
    expect($preview[0]['new_price'])->toBe(165.0); // +10%
    expect($preview[0]['difference'])->toBe(15.0);
    expect($preview[0]['difference_percent'])->toBe(10.0);

    expect($preview[1]['product_id'])->toBe(2);
    expect($preview[1]['current_price'])->toBe(250.0);
    expect($preview[1]['new_price'])->toBe(275.0); // +10%
});

it('previews fixed adjustment correctly', function () {
    $products = collect([
        Product::factory()->make([
            'id' => 1,
            'name' => 'Product A',
            'manufacturer_cost_price' => 100,
            'sale_markup_percent' => 50, // Sale price = 150
        ]),
    ]);

    $preview = $this->service->previewPriceAdjustment($products, 'fixed', 25);

    expect($preview[0]['current_price'])->toBe(150.0);
    expect($preview[0]['new_price'])->toBe(175.0); // +25
    expect($preview[0]['difference'])->toBe(25.0);
});

it('previews negative adjustment', function () {
    $products = collect([
        Product::factory()->make([
            'id' => 1,
            'name' => 'Product A',
            'manufacturer_cost_price' => 100,
            'sale_markup_percent' => 50, // Sale price = 150
        ]),
    ]);

    $preview = $this->service->previewPriceAdjustment($products, 'percentage', -20);

    expect($preview[0]['current_price'])->toBe(150.0);
    expect($preview[0]['new_price'])->toBe(120.0); // -20%
    expect($preview[0]['difference'])->toBe(-30.0);
    expect($preview[0]['difference_percent'])->toBe(-20.0);
});

it('handles zero current price in preview', function () {
    $products = collect([
        Product::factory()->make([
            'id' => 1,
            'name' => 'Free Product',
            'manufacturer_cost_price' => 0,
            'sale_markup_percent' => 0,
        ]),
    ]);

    $preview = $this->service->previewPriceAdjustment($products, 'percentage', 10);

    expect($preview[0]['difference_percent'])->toBe(0.0);
});

it('returns empty preview for empty products', function () {
    $preview = $this->service->previewPriceAdjustment(collect([]), 'percentage', 10);

    expect($preview)->toBe([]);
});
