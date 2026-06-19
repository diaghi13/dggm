<?php

use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Domains\Warehouse\Models\StockMovement;
use App\Domains\Warehouse\Models\Warehouse;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;
use App\Listeners\UpdateProductStandardCostListener;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->warehouse = Warehouse::factory()->create();
});

test('standard cost is updated on INTAKE movement for ARTICLE products', function () {
    // Create product with suppliers
    $product = Product::factory()->create([
        'product_type' => ProductType::ARTICLE,
        'standard_cost' => null,
    ]);

    $supplier1 = Supplier::factory()->create();
    $supplier2 = Supplier::factory()->create();

    $product->suppliers()->attach($supplier1->id, [
        'purchase_price' => 100.00,
        'is_active' => true,
        'is_preferred_supplier' => false,
    ]);

    $product->suppliers()->attach($supplier2->id, [
        'purchase_price' => 120.00,
        'is_active' => true,
        'is_preferred_supplier' => false,
    ]);

    // Create INTAKE movement with no unit_cost to isolate supplier-based calculation
    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::INTAKE,
        'quantity' => 10,
        'unit_cost' => 0,
    ]);

    // Dispatch event and handle
    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    // Verify standard_cost is updated to highest price
    $product->refresh();
    expect((float) $product->standard_cost)->toBe(120.00);
});

test('standard cost is NOT updated for OUTPUT movements', function () {
    $product = Product::factory()->create([
        'product_type' => ProductType::ARTICLE,
        'standard_cost' => 50.00,
    ]);

    $supplier = Supplier::factory()->create();
    $product->suppliers()->attach($supplier->id, [
        'purchase_price' => 100.00,
        'is_active' => true,
    ]);

    // Create OUTPUT movement
    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::OUTPUT,
        'quantity' => 5,
    ]);

    // Dispatch event
    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    // Verify standard_cost is NOT changed
    $product->refresh();
    expect((float) $product->standard_cost)->toBe(50.00);
});

test('standard cost is NOT updated for SERVICE products', function () {
    $product = Product::factory()->create([
        'product_type' => ProductType::SERVICE,
        'standard_cost' => null,
    ]);

    $supplier = Supplier::factory()->create();
    $product->suppliers()->attach($supplier->id, [
        'purchase_price' => 100.00,
        'is_active' => true,
    ]);

    // Create INTAKE movement
    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::INTAKE,
        'quantity' => 1,
    ]);

    // Dispatch event
    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    // Verify standard_cost remains NULL
    $product->refresh();
    expect($product->standard_cost)->toBeNull();
});

test('standard cost is NOT updated for COMPOSITE products', function () {
    $product = Product::factory()->create([
        'product_type' => ProductType::COMPOSITE,
        'standard_cost' => null,
    ]);

    $supplier = Supplier::factory()->create();
    $product->suppliers()->attach($supplier->id, [
        'purchase_price' => 100.00,
        'is_active' => true,
    ]);

    // Create INTAKE movement
    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::INTAKE,
        'quantity' => 1,
    ]);

    // Dispatch event
    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    // Verify standard_cost remains NULL
    $product->refresh();
    expect($product->standard_cost)->toBeNull();
});

test('standard cost is NULL when product has no suppliers', function () {
    $product = Product::factory()->create([
        'product_type' => ProductType::ARTICLE,
        'standard_cost' => 50.00,
    ]);

    // No suppliers attached

    // Create INTAKE movement with no unit_cost (no price info available)
    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::INTAKE,
        'quantity' => 10,
        'unit_cost' => 0,
    ]);

    // Dispatch event
    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    // Verify standard_cost unchanged (no supplier prices and no movement unit_cost)
    $product->refresh();
    expect((float) $product->standard_cost)->toBe(50.00);
});

test('standard cost uses weighted average when strategy is weighted_average', function () {
    // Set setting for weighted_average strategy
    app(\App\Services\SettingService::class)->set('pricing.purchase_price_strategy', 'weighted_average', null, 'pricing', true);

    $product = Product::factory()->create([
        'product_type' => ProductType::ARTICLE,
        'standard_cost' => null,
    ]);

    $supplier1 = Supplier::factory()->create();
    $supplier2 = Supplier::factory()->create();

    // Regular supplier: price 100, weight 1
    $product->suppliers()->attach($supplier1->id, [
        'purchase_price' => 100.00,
        'is_active' => true,
        'is_preferred_supplier' => false,
    ]);

    // Preferred supplier: price 120, weight 2
    $product->suppliers()->attach($supplier2->id, [
        'purchase_price' => 120.00,
        'is_active' => true,
        'is_preferred_supplier' => true,
    ]);

    // Create INTAKE movement with no unit_cost to isolate supplier-based calculation
    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::INTAKE,
        'quantity' => 10,
        'unit_cost' => 0,
    ]);

    // Dispatch event
    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    // Verify weighted average: (100*1 + 120*2) / (1+2) = 340/3 = 113.33
    $product->refresh();
    expect((float) $product->standard_cost)->toBe(113.33);
});

test('standard cost ignores inactive suppliers', function () {
    $product = Product::factory()->create([
        'product_type' => ProductType::ARTICLE,
        'standard_cost' => null,
    ]);

    $supplier1 = Supplier::factory()->create();
    $supplier2 = Supplier::factory()->create();

    // Active supplier
    $product->suppliers()->attach($supplier1->id, [
        'purchase_price' => 100.00,
        'is_active' => true,
    ]);

    // Inactive supplier (should be ignored)
    $product->suppliers()->attach($supplier2->id, [
        'purchase_price' => 200.00,
        'is_active' => false,
    ]);

    // Create INTAKE movement with no unit_cost to isolate supplier-based calculation
    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::INTAKE,
        'quantity' => 10,
        'unit_cost' => 0,
    ]);

    // Dispatch event
    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    // Verify only active supplier price is used
    $product->refresh();
    expect((float) $product->standard_cost)->toBe(100.00);
});

test('estimated_base_day is updated for rentable products regardless of auto_recalculate setting', function () {
    $product = Product::factory()->create([
        'product_type' => ProductType::ARTICLE,
        'standard_cost' => null,
        'is_rentable' => true,
        'is_premium' => false,
        'rental_price_estimated' => false,
        'estimated_base_day' => null,
    ]);

    $supplier = Supplier::factory()->create();
    $product->suppliers()->attach($supplier->id, [
        'purchase_price' => 100.00,
        'is_active' => true,
        'is_preferred_supplier' => true,
    ]);

    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::INTAKE,
        'quantity' => 5,
        'unit_cost' => 0,
    ]);

    // Ensure auto_recalculate is OFF (default) — estimated_base_day must still update
    \App\Models\Setting::updateOrCreate(
        ['key' => 'pricing.auto_recalculate_price_list_on_purchase'],
        ['value' => '0', 'group' => 'pricing', 'type' => 'boolean']
    );

    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    $product->refresh();

    // standard_cost updated to supplier price
    expect((float) $product->standard_cost)->toBe(100.00);

    // estimated_base_day updated even though auto_recalculate is false
    expect($product->estimated_base_day)->not->toBeNull();
    expect((float) $product->estimated_base_day)->toBeGreaterThan(0.0);
});

test('estimated_base_day is NOT updated when rental_price_estimated is true', function () {
    $product = Product::factory()->create([
        'product_type' => ProductType::ARTICLE,
        'standard_cost' => null,
        'is_rentable' => true,
        'rental_price_estimated' => true,
        'estimated_base_day' => 5.00, // manual value set by user
    ]);

    $supplier = Supplier::factory()->create();
    $product->suppliers()->attach($supplier->id, [
        'purchase_price' => 100.00,
        'is_active' => true,
    ]);

    $movement = StockMovement::factory()->create([
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouse->id,
        'type' => StockMovementType::INTAKE,
        'quantity' => 5,
        'unit_cost' => 0,
    ]);

    $event = new StockMovementCreated($movement);
    $listener = app(UpdateProductStandardCostListener::class);
    $listener->handle($event);

    $product->refresh();

    // estimated_base_day must remain untouched (manual override)
    expect((float) $product->estimated_base_day)->toBe(5.00);
});
