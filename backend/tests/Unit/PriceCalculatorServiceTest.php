<?php

use App\Models\Product;
use App\Models\Supplier;
use App\Services\PriceCalculatorService;
use App\ValueObjects\Money;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(PriceCalculatorService::class);
});

// ==========================================
// MARKUP CALCULATION TESTS
// ==========================================

it('calculates price with markup correctly', function () {
    $cost = Money::EUR(100);
    $result = $this->service->calculateMarkup($cost, 50);

    expect($result->amount)->toBe(150.0);
    expect($result->currency)->toBe('EUR');
});

it('calculates price with zero markup', function () {
    $cost = Money::EUR(100);
    $result = $this->service->calculateMarkup($cost, 0);

    expect($result->amount)->toBe(100.0);
});

it('calculates price with decimal markup', function () {
    $cost = Money::EUR(100);
    $result = $this->service->calculateMarkup($cost, 25.5);

    expect($result->amount)->toBe(125.5);
});

// ==========================================
// DISCOUNT TESTS
// ==========================================

it('applies percentage discount correctly', function () {
    $price = Money::EUR(100);
    $result = $this->service->applyDiscount($price, 20);

    expect($result->amount)->toBe(80.0);
});

it('applies zero discount', function () {
    $price = Money::EUR(100);
    $result = $this->service->applyDiscount($price, 0);

    expect($result->amount)->toBe(100.0);
});

it('applies full discount', function () {
    $price = Money::EUR(100);
    $result = $this->service->applyDiscount($price, 100);

    expect($result->amount)->toBe(0.0);
});

it('applies fixed discount correctly', function () {
    $price = Money::EUR(100);
    $discount = Money::EUR(25);
    $result = $this->service->applyFixedDiscount($price, $discount);

    expect($result->amount)->toBe(75.0);
});

// ==========================================
// VAT CALCULATION TESTS
// ==========================================

it('calculates VAT with standard rate', function () {
    $price = Money::EUR(100);
    $vat = $this->service->calculateVAT($price);

    expect($vat->amount)->toBe(22.0); // 22% standard rate
});

it('calculates VAT with custom rate', function () {
    $price = Money::EUR(100);
    $vat = $this->service->calculateVAT($price, 10);

    expect($vat->amount)->toBe(10.0);
});

it('adds VAT to price correctly', function () {
    $price = Money::EUR(100);
    $result = $this->service->addVAT($price);

    expect($result->amount)->toBe(122.0); // 100 + 22% VAT
});

it('adds custom VAT to price', function () {
    $price = Money::EUR(100);
    $result = $this->service->addVAT($price, 10);

    expect($result->amount)->toBe(110.0);
});

it('removes VAT from price correctly', function () {
    $priceWithVAT = Money::EUR(122);
    $result = $this->service->removeVAT($priceWithVAT);

    expect($result->amount)->toBe(100.0);
});

it('removes custom VAT from price', function () {
    $priceWithVAT = Money::EUR(110);
    $result = $this->service->removeVAT($priceWithVAT, 10);

    expect($result->amount)->toBe(100.0);
});

// ==========================================
// FINAL PRICE CALCULATION TESTS
// ==========================================

it('calculates final price with all options', function () {
    $baseCost = Money::EUR(100);

    $result = $this->service->calculateFinalPrice($baseCost, [
        'markup' => 50,              // 100 -> 150
        'discount_percent' => 10,    // 150 -> 135
        'add_vat' => true,           // 135 -> 164.7
        'vat_rate' => 22,
    ]);

    expect($result->amount)->toBe(164.7);
});

it('calculates final price with markup only', function () {
    $baseCost = Money::EUR(100);

    $result = $this->service->calculateFinalPrice($baseCost, [
        'markup' => 30,
    ]);

    expect($result->amount)->toBe(130.0);
});

it('calculates final price with discount only', function () {
    $baseCost = Money::EUR(100);

    $result = $this->service->calculateFinalPrice($baseCost, [
        'discount_percent' => 15,
    ]);

    expect($result->amount)->toBe(85.0);
});

it('calculates final price with fixed discount', function () {
    $baseCost = Money::EUR(100);

    $result = $this->service->calculateFinalPrice($baseCost, [
        'markup' => 50,                        // 100 -> 150
        'discount_fixed' => Money::EUR(20),    // 150 -> 130
    ]);

    expect($result->amount)->toBe(130.0);
});

it('returns base cost when no options provided', function () {
    $baseCost = Money::EUR(100);

    $result = $this->service->calculateFinalPrice($baseCost, []);

    expect($result->amount)->toBe(100.0);
});

// ==========================================
// MARGIN CALCULATION TESTS
// ==========================================

it('calculates margin percent correctly', function () {
    $cost = Money::EUR(80);
    $sellPrice = Money::EUR(100);

    $margin = $this->service->calculateMarginPercent($cost, $sellPrice);

    expect($margin)->toBe(20.0); // ((100-80)/100)*100
});

it('calculates zero margin', function () {
    $cost = Money::EUR(100);
    $sellPrice = Money::EUR(100);

    $margin = $this->service->calculateMarginPercent($cost, $sellPrice);

    expect($margin)->toBe(0.0);
});

it('calculates margin with zero sell price', function () {
    $cost = Money::EUR(50);
    $sellPrice = Money::EUR(0);

    $margin = $this->service->calculateMarginPercent($cost, $sellPrice);

    expect($margin)->toBe(0.0);
});

// ==========================================
// MARKUP PERCENT CALCULATION TESTS
// ==========================================

it('calculates markup percent correctly', function () {
    $cost = Money::EUR(80);
    $sellPrice = Money::EUR(100);

    $markup = $this->service->calculateMarkupPercent($cost, $sellPrice);

    expect($markup)->toBe(25.0); // ((100-80)/80)*100
});

it('calculates zero markup', function () {
    $cost = Money::EUR(100);
    $sellPrice = Money::EUR(100);

    $markup = $this->service->calculateMarkupPercent($cost, $sellPrice);

    expect($markup)->toBe(0.0);
});

it('calculates markup with zero cost', function () {
    $cost = Money::EUR(0);
    $sellPrice = Money::EUR(100);

    $markup = $this->service->calculateMarkupPercent($cost, $sellPrice);

    expect($markup)->toBe(0.0);
});

// ==========================================
// SELL PRICE FROM MARGIN TESTS
// ==========================================

it('calculates sell price from margin', function () {
    $cost = Money::EUR(80);

    $sellPrice = $this->service->calculateSellPriceFromMargin($cost, 20);

    expect($sellPrice->amount)->toBe(100.0); // 80 / (1 - 0.2)
});

it('throws exception for margin >= 100%', function () {
    $cost = Money::EUR(100);

    expect(fn () => $this->service->calculateSellPriceFromMargin($cost, 100))
        ->toThrow(\InvalidArgumentException::class, 'Margin percent cannot be >= 100%');
});

it('calculates sell price from zero margin', function () {
    $cost = Money::EUR(100);

    $sellPrice = $this->service->calculateSellPriceFromMargin($cost, 0);

    expect($sellPrice->amount)->toBe(100.0);
});

// ==========================================
// TOTAL CALCULATION TESTS
// ==========================================

it('calculates total from array of prices', function () {
    $prices = [
        Money::EUR(10),
        Money::EUR(20),
        Money::EUR(30.5),
    ];

    $total = $this->service->calculateTotal($prices);

    expect($total->amount)->toBe(60.5);
});

it('returns zero for empty price array', function () {
    $total = $this->service->calculateTotal([]);

    expect($total->amount)->toBe(0.0);
});

it('calculates total with single price', function () {
    $prices = [Money::EUR(50)];

    $total = $this->service->calculateTotal($prices);

    expect($total->amount)->toBe(50.0);
});

// ==========================================
// TOTAL WITH QUANTITY TESTS
// ==========================================

it('calculates total with quantities', function () {
    $items = [
        ['price' => Money::EUR(10), 'quantity' => 2],
        ['price' => Money::EUR(20), 'quantity' => 3],
        ['price' => Money::EUR(5), 'quantity' => 10],
    ];

    $total = $this->service->calculateTotalWithQuantity($items);

    expect($total->amount)->toBe(130.0); // (10*2) + (20*3) + (5*10)
});

it('returns zero for empty items', function () {
    $total = $this->service->calculateTotalWithQuantity([]);

    expect($total->amount)->toBe(0.0);
});

it('calculates total with decimal quantities', function () {
    $items = [
        ['price' => Money::EUR(10), 'quantity' => 1.5],
        ['price' => Money::EUR(20), 'quantity' => 2.25],
    ];

    $total = $this->service->calculateTotalWithQuantity($items);

    expect($total->amount)->toBe(60.0); // (10*1.5) + (20*2.25)
});

// ==========================================
// WEIGHTED AVERAGE TESTS
// ==========================================

it('calculates weighted average', function () {
    $items = [
        ['price' => Money::EUR(100), 'weight' => 2],
        ['price' => Money::EUR(200), 'weight' => 1],
    ];

    $avg = $this->service->calculateWeightedAverage($items);

    expect($avg->amount)->toBe(133.33); // (100*2 + 200*1) / 3
});

it('returns zero for empty weighted items', function () {
    $avg = $this->service->calculateWeightedAverage([]);

    expect($avg->amount)->toBe(0.0);
});

it('returns zero when total weight is zero', function () {
    $items = [
        ['price' => Money::EUR(100), 'weight' => 0],
        ['price' => Money::EUR(200), 'weight' => 0],
    ];

    $avg = $this->service->calculateWeightedAverage($items);

    expect($avg->amount)->toBe(0.0);
});

// ==========================================
// PRODUCT PURCHASE PRICE TESTS
// ==========================================

it('calculates purchase price from highest supplier', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
    ]);

    $supplier1 = Supplier::factory()->create();
    $supplier2 = Supplier::factory()->create();

    $product->suppliers()->attach($supplier1->id, [
        'purchase_price' => 110,
        'is_active' => true,
    ]);

    $product->suppliers()->attach($supplier2->id, [
        'purchase_price' => 120,
        'is_active' => true,
    ]);

    $price = $this->service->calculateProductPurchasePrice($product, 'highest');

    expect($price)->toBe(120.0);
});

it('calculates purchase price from lowest supplier', function () {
    $product = Product::factory()->create();

    $supplier1 = Supplier::factory()->create();
    $supplier2 = Supplier::factory()->create();

    $product->suppliers()->attach($supplier1->id, [
        'purchase_price' => 110,
        'is_active' => true,
    ]);

    $product->suppliers()->attach($supplier2->id, [
        'purchase_price' => 90,
        'is_active' => true,
    ]);

    $price = $this->service->calculateProductPurchasePrice($product, 'lowest');

    expect($price)->toBe(90.0);
});

it('falls back to manufacturer cost when no suppliers', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 85.50,
    ]);

    $price = $this->service->calculateProductPurchasePrice($product);

    expect($price)->toBe(85.5);
});

it('ignores inactive suppliers', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
    ]);

    $supplier1 = Supplier::factory()->create();
    $supplier2 = Supplier::factory()->create();

    $product->suppliers()->attach($supplier1->id, [
        'purchase_price' => 200,
        'is_active' => false, // Inactive
    ]);

    $product->suppliers()->attach($supplier2->id, [
        'purchase_price' => 120,
        'is_active' => true,
    ]);

    $price = $this->service->calculateProductPurchasePrice($product);

    expect($price)->toBe(120.0); // Should ignore inactive supplier
});

// ==========================================
// PRODUCT SALE PRICE TESTS
// ==========================================

it('calculates sale price with markup', function () {
    $product = Product::factory()->create([
        'manufacturer_cost_price' => 100,
        'sale_markup_percent' => 50,
    ]);

    $price = $this->service->calculateProductSalePrice($product);

    expect($price)->toBe(150.0); // 100 * 1.5
});

// ==========================================
// RENTAL PRICES TESTS
// ==========================================

it('calculates rental prices from sale price', function () {
    $salePrice = 300;

    $rentalPrices = $this->service->calculateRentalPrices($salePrice);

    expect($rentalPrices)->toBeArray();
    expect($rentalPrices)->toHaveKeys(['daily', 'weekly', 'monthly']);
    expect($rentalPrices['daily'])->toBeGreaterThan(0);
    expect($rentalPrices['weekly'])->toBeGreaterThan($rentalPrices['daily']);
    expect($rentalPrices['monthly'])->toBeGreaterThan($rentalPrices['weekly']);
});

it('returns zero rental prices for zero sale price', function () {
    $rentalPrices = $this->service->calculateRentalPrices(0);

    expect($rentalPrices['daily'])->toBe(0.0);
    expect($rentalPrices['weekly'])->toBe(0.0);
    expect($rentalPrices['monthly'])->toBe(0.0);
});

// ==========================================
// PRICE LIST ADJUSTMENT TESTS
// ==========================================

it('applies percentage adjustment to price', function () {
    $basePrice = 100;

    $adjusted = $this->service->applyPriceListAdjustment($basePrice, 'percentage', 10);

    expect($adjusted)->toBe(110.0);
});

it('applies negative percentage adjustment', function () {
    $basePrice = 100;

    $adjusted = $this->service->applyPriceListAdjustment($basePrice, 'percentage', -15);

    expect($adjusted)->toBe(85.0);
});

it('applies fixed adjustment to price', function () {
    $basePrice = 100;

    $adjusted = $this->service->applyPriceListAdjustment($basePrice, 'fixed', 25);

    expect($adjusted)->toBe(125.0);
});

it('applies negative fixed adjustment', function () {
    $basePrice = 100;

    $adjusted = $this->service->applyPriceListAdjustment($basePrice, 'fixed', -20);

    expect($adjusted)->toBe(80.0);
});

it('returns base price for none adjustment type', function () {
    $basePrice = 100;

    $adjusted = $this->service->applyPriceListAdjustment($basePrice, 'none', 50);

    expect($adjusted)->toBe(100.0);
});

it('returns base price when adjustment value is null', function () {
    $basePrice = 100;

    $adjusted = $this->service->applyPriceListAdjustment($basePrice, 'percentage', null);

    expect($adjusted)->toBe(100.0);
});

it('returns base price for invalid adjustment type', function () {
    $basePrice = 100;

    $adjusted = $this->service->applyPriceListAdjustment($basePrice, 'invalid', 10);

    expect($adjusted)->toBe(100.0);
});
