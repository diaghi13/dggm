<?php

use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductCategory;
use App\Enums\PriceListAdjustmentType;
use App\Enums\PriceListAppliesTo;
use App\Enums\PriceListCalculationMode;
use App\Events\PriceListGenerated;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

use function Pest\Laravel\assertDatabaseHas;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    Sanctum::actingAs($this->user);
});

// ==========================================
// INDEX TESTS
// ==========================================

it('can list all active price lists', function () {
    // Create active and inactive price lists
    $activePriceList = PriceList::create([
        'name' => 'Standard Prices',
        'code' => 'STD-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::Percentage,
        'adjustment_value' => 10,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    PriceList::create([
        'name' => 'Inactive Prices',
        'code' => 'OLD-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Sale,
        'is_active' => false,
    ]);

    $response = $this->getJson('/api/v1/price-lists');

    $response->assertSuccessful()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'code',
                    'calculation_mode',
                    'adjustment_type',
                    'applies_to',
                    'is_active',
                ],
            ],
        ]);

    // Only active price list should be returned
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('Standard Prices');
});

it('requires authentication to list price lists', function () {
    // Create new unauthenticated request
    $testCase = new TestCase;
    $testCase->setUp();

    $response = $testCase->getJson('/api/v1/price-lists');

    $response->assertUnauthorized();
});

it('requires permission to list price lists', function () {
    $workerUser = User::factory()->create();
    $workerUser->assignRole('worker');
    Sanctum::actingAs($workerUser);

    $response = $this->getJson('/api/v1/price-lists');

    $response->assertForbidden();
});

// ==========================================
// SHOW TESTS
// ==========================================

it('can show single price list with items', function () {
    $category = ProductCategory::factory()->create();
    $product = Product::factory()->create(['category_id' => $category->id]);

    $priceList = PriceList::create([
        'name' => 'Test Price List',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::Percentage,
        'adjustment_value' => 15,
        'applies_to' => PriceListAppliesTo::Both,
        'category_id' => $category->id,
        'is_active' => true,
    ]);

    PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $product->id,
        'sale_price' => 100.00,
        'is_manual_price' => false,
        'rental_daily' => 10.00,
        'rental_weekly' => 50.00,
        'rental_monthly' => 150.00,
        'is_manual_rental' => false,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/price-lists/{$priceList->id}");

    $response->assertSuccessful()
        ->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'name',
                'code',
                'items' => [
                    '*' => [
                        'id',
                        'product_id',
                        'sale_price',
                        'is_manual_price',
                        'rental_daily',
                        'is_active',
                    ],
                ],
                'category',
            ],
        ]);

    expect($response->json('data.items'))->toHaveCount(1);
});

it('requires authorization to view price list', function () {
    $priceList = PriceList::create([
        'name' => 'Test',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Sale,
        'is_active' => true,
    ]);

    $workerUser = User::factory()->create();
    $workerUser->assignRole('worker');
    Sanctum::actingAs($workerUser);

    $response = $this->getJson("/api/v1/price-lists/{$priceList->id}");

    $response->assertForbidden();
});

// ==========================================
// STORE TESTS
// ==========================================

it('can create price list with automatic calculation', function () {
    Event::fake([PriceListGenerated::class]);

    Product::factory()->count(3)->create(['is_active' => true]);

    $response = $this->postJson('/api/v1/price-lists', [
        'name' => 'New Price List',
        'code' => 'NEW-001',
        'calculation_mode' => PriceListCalculationMode::Automatic->value,
        'adjustment_type' => PriceListAdjustmentType::Percentage->value,
        'adjustment_value' => 20,
        'applies_to' => PriceListAppliesTo::Both->value,
        'is_active' => true,
        'is_default' => false,
        'generate_items' => true,
    ]);

    $response->assertCreated()
        ->assertJson([
            'success' => true,
            'message' => 'Price list created successfully',
        ]);

    assertDatabaseHas('price_lists', [
        'name' => 'New Price List',
        'code' => 'NEW-001',
        'calculation_mode' => PriceListCalculationMode::Automatic->value,
        'adjustment_type' => PriceListAdjustmentType::Percentage->value,
        'adjustment_value' => 20,
    ]);

    // Check items were created
    $priceListId = $response->json('data.id');
    expect(PriceListItem::where('price_list_id', $priceListId)->count())->toBe(3);

    Event::assertDispatched(PriceListGenerated::class);
});

it('can create price list with manual calculation', function () {
    Product::factory()->count(2)->create(['is_active' => true]);

    $response = $this->postJson('/api/v1/price-lists', [
        'name' => 'Manual Price List',
        'code' => 'MAN-001',
        'calculation_mode' => PriceListCalculationMode::Manual->value,
        'adjustment_type' => PriceListAdjustmentType::None->value,
        'applies_to' => PriceListAppliesTo::Sale->value,
        'is_active' => true,
        'is_default' => false,
        'generate_items' => true,
    ]);

    $response->assertCreated();

    $priceListId = $response->json('data.id');
    $items = PriceListItem::where('price_list_id', $priceListId)->get();

    // Manual mode should mark items as manual
    foreach ($items as $item) {
        expect($item->is_manual_price)->toBeTrue();
    }
});

it('can create price list with fixed adjustment', function () {
    Product::factory()->create(['is_active' => true, 'purchase_price' => 100]);

    $response = $this->postJson('/api/v1/price-lists', [
        'name' => 'Fixed Adjustment',
        'code' => 'FIX-001',
        'calculation_mode' => PriceListCalculationMode::Automatic->value,
        'adjustment_type' => PriceListAdjustmentType::Fixed->value,
        'adjustment_value' => 25,
        'applies_to' => PriceListAppliesTo::Both->value,
        'is_active' => true,
        'is_default' => false,
        'generate_items' => true,
    ]);

    $response->assertCreated();
});

it('can create price list without generating items', function () {
    Product::factory()->count(5)->create(['is_active' => true]);

    $response = $this->postJson('/api/v1/price-lists', [
        'name' => 'Empty Price List',
        'code' => 'EMPTY-001',
        'calculation_mode' => PriceListCalculationMode::Manual->value,
        'adjustment_type' => PriceListAdjustmentType::None->value,
        'applies_to' => PriceListAppliesTo::Sale->value,
        'is_active' => true,
        'is_default' => false,
        'generate_items' => false,
    ]);

    $response->assertCreated();

    $priceListId = $response->json('data.id');
    expect(PriceListItem::where('price_list_id', $priceListId)->count())->toBe(0);
});

it('can create price list filtered by category', function () {
    $category1 = ProductCategory::factory()->create();
    $category2 = ProductCategory::factory()->create();

    Product::factory()->count(2)->create(['category_id' => $category1->id, 'is_active' => true]);
    Product::factory()->count(3)->create(['category_id' => $category2->id, 'is_active' => true]);

    $response = $this->postJson('/api/v1/price-lists', [
        'name' => 'Category Filtered',
        'code' => 'CAT-001',
        'calculation_mode' => PriceListCalculationMode::Automatic->value,
        'adjustment_type' => PriceListAdjustmentType::Percentage->value,
        'adjustment_value' => 10,
        'applies_to' => PriceListAppliesTo::Both->value,
        'category_id' => $category1->id,
        'is_active' => true,
        'generate_items' => true,
    ]);

    $response->assertCreated();

    // Should only create items for category1 products
    $priceListId = $response->json('data.id');
    expect(PriceListItem::where('price_list_id', $priceListId)->count())->toBe(2);
});

it('validates required fields when creating price list', function () {
    $response = $this->postJson('/api/v1/price-lists', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'code', 'calculation_mode', 'applies_to']);
});

it('requires permission to create price list', function () {
    $accountantUser = User::factory()->create();
    $accountantUser->assignRole('accountant');
    Sanctum::actingAs($accountantUser);

    $response = $this->postJson('/api/v1/price-lists', [
        'name' => 'Test',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Manual->value,
        'adjustment_type' => PriceListAdjustmentType::None->value,
        'applies_to' => PriceListAppliesTo::Sale->value,
        'is_active' => true,
    ]);

    $response->assertForbidden();
});

// ==========================================
// UPDATE TESTS
// ==========================================

it('can update price list', function () {
    $priceList = PriceList::create([
        'name' => 'Original Name',
        'code' => 'ORIG-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Sale,
        'is_active' => true,
    ]);

    $response = $this->putJson("/api/v1/price-lists/{$priceList->id}", [
        'name' => 'Updated Name',
        'code' => 'UPD-001', // Use unique code
        'description' => 'Updated description',
        'calculation_mode' => PriceListCalculationMode::Automatic->value,
        'adjustment_type' => PriceListAdjustmentType::Percentage->value,
        'adjustment_value' => 15,
        'applies_to' => PriceListAppliesTo::Both->value,
        'is_active' => true,
    ]);

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'message' => 'Price list updated successfully',
        ]);

    assertDatabaseHas('price_lists', [
        'id' => $priceList->id,
        'name' => 'Updated Name',
        'code' => 'UPD-001',
        'description' => 'Updated description',
        'calculation_mode' => PriceListCalculationMode::Automatic->value,
        'adjustment_value' => 15,
    ]);
});

it('can deactivate price list', function () {
    $priceList = PriceList::create([
        'name' => 'Active List',
        'code' => 'DEACT-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Sale,
        'is_active' => true,
    ]);

    $response = $this->putJson("/api/v1/price-lists/{$priceList->id}", [
        'name' => 'Active List',
        'code' => 'DEACT-001',
        'calculation_mode' => PriceListCalculationMode::Manual->value,
        'adjustment_type' => PriceListAdjustmentType::None->value,
        'applies_to' => PriceListAppliesTo::Sale->value,
        'is_active' => false,
    ]);

    $response->assertSuccessful();

    assertDatabaseHas('price_lists', [
        'id' => $priceList->id,
        'is_active' => false,
    ]);
});

it('requires permission to update price list', function () {
    $priceList = PriceList::create([
        'name' => 'Test',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Sale,
        'is_active' => true,
    ]);

    $workerUser = User::factory()->create();
    $workerUser->assignRole('worker');
    Sanctum::actingAs($workerUser);

    $response = $this->putJson("/api/v1/price-lists/{$priceList->id}", [
        'name' => 'Updated',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Manual->value,
        'adjustment_type' => PriceListAdjustmentType::None->value,
        'applies_to' => PriceListAppliesTo::Sale->value,
        'is_active' => true,
    ]);

    $response->assertForbidden();
});

// ==========================================
// DESTROY TESTS
// ==========================================

it('can delete price list', function () {
    $priceList = PriceList::create([
        'name' => 'To Delete',
        'code' => 'DEL-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Sale,
        'is_active' => true,
    ]);

    $response = $this->deleteJson("/api/v1/price-lists/{$priceList->id}");

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'message' => 'Price list deleted successfully',
        ]);

    // Soft delete - should still exist in DB
    expect(PriceList::withTrashed()->find($priceList->id))->not->toBeNull();
    expect(PriceList::find($priceList->id))->toBeNull();
});

it('deletes price list items when price list is deleted', function () {
    $priceList = PriceList::create([
        'name' => 'With Items',
        'code' => 'ITEMS-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Sale,
        'is_active' => true,
    ]);

    $product = Product::factory()->create();
    PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $product->id,
        'sale_price' => 100,
        'is_manual_price' => true,
        'is_active' => true,
    ]);

    $this->deleteJson("/api/v1/price-lists/{$priceList->id}");

    // Items should be soft deleted too (if cascade delete configured)
    expect(PriceListItem::where('price_list_id', $priceList->id)->count())->toBe(0);
});

it('requires permission to delete price list', function () {
    $priceList = PriceList::create([
        'name' => 'Test',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Manual,
        'adjustment_type' => PriceListAdjustmentType::None,
        'applies_to' => PriceListAppliesTo::Sale,
        'is_active' => true,
    ]);

    $workerUser = User::factory()->create();
    $workerUser->assignRole('worker');
    Sanctum::actingAs($workerUser);

    $response = $this->deleteJson("/api/v1/price-lists/{$priceList->id}");

    $response->assertForbidden();
});

// ==========================================
// REGENERATE TESTS
// ==========================================

it('can regenerate price list items', function () {
    Event::fake([PriceListGenerated::class]);

    $priceList = PriceList::create([
        'name' => 'To Regenerate',
        'code' => 'REGEN-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::Percentage,
        'adjustment_value' => 10,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    // Create old items
    $product1 = Product::factory()->create(['is_active' => true]);
    $product2 = Product::factory()->create(['is_active' => true]);

    PriceListItem::create([
        'price_list_id' => $priceList->id,
        'product_id' => $product1->id,
        'sale_price' => 50,
        'is_manual_price' => false,
        'is_active' => true,
    ]);

    // Create new product after price list
    $product3 = Product::factory()->create(['is_active' => true]);

    $response = $this->postJson("/api/v1/price-lists/{$priceList->id}/regenerate");

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'message' => 'Price list regenerated successfully',
        ]);

    // Should have items for all 3 products now
    expect(PriceListItem::where('price_list_id', $priceList->id)->count())->toBe(3);

    Event::assertDispatched(PriceListGenerated::class);
});

it('requires permission to regenerate price list', function () {
    $priceList = PriceList::create([
        'name' => 'Test',
        'code' => 'TEST-001',
        'calculation_mode' => PriceListCalculationMode::Automatic,
        'adjustment_type' => PriceListAdjustmentType::Percentage,
        'adjustment_value' => 10,
        'applies_to' => PriceListAppliesTo::Both,
        'is_active' => true,
    ]);

    $workerUser = User::factory()->create();
    $workerUser->assignRole('worker');
    Sanctum::actingAs($workerUser);

    $response = $this->postJson("/api/v1/price-lists/{$priceList->id}/regenerate");

    $response->assertForbidden();
});
