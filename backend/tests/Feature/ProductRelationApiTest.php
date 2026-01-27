<?php

use App\Enums\ProductRelationQuantityType;
use App\Enums\ProductType;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductRelation;
use App\Models\ProductRelationType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    // Run seeders for roles, permissions, categories and relation types
    $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
    $this->artisan('db:seed', ['--class' => 'ProductCategorySeeder']);
    $this->artisan('db:seed', ['--class' => 'ProductRelationTypeSeeder']);

    // Create test user with admin role
    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
});

it('can list product categories', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/v1/product-categories');

    $response->assertSuccessful()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'code', 'name', 'icon', 'color'],
            ],
        ]);

    expect($response->json('data'))->toHaveCount(9);
});

it('can list product relation types', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/v1/product-relation-types');

    $response->assertSuccessful()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'code', 'name'],
            ],
        ]);

    expect($response->json('data'))->toHaveCount(6);
});

it('can calculate product relations with 3 lists', function () {
    // Create test products
    $category = ProductCategory::where('code', 'electrical')->first();
    $containerCategory = ProductCategory::where('code', 'containers')->first();

    $smartbat = Product::create([
        'code' => 'TEST-SMARTBAT',
        'name' => 'SmartBat S300',
        'category_id' => $category->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 20.00,
        'sale_price' => 850.00,
    ]);

    $cable = Product::create([
        'code' => 'TEST-CABLE',
        'name' => 'Cavo Alimentazione',
        'category_id' => $category->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 0.00,
        'sale_price' => 25.00,
    ]);

    $container = Product::create([
        'code' => 'TEST-CONTAINER',
        'name' => 'Baule Trasporto 6pz',
        'category_id' => $containerCategory->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 0.00,
        'sale_price' => 0.00,
    ]);

    $smartbatKit = Product::query()->create([
        'code' => 'TEST-SMARTBAT-KIT',
        'name' => 'Kit SmartBat S300',
        'category_id' => $category->id,
        'product_type' => ProductType::COMPOSITE,
        'unit' => 'pz',
        'purchase_price' => 0.00,
        'sale_price' => 900.00,
    ]);

    // Create relations
    $containerType = ProductRelationType::where('code', 'container')->first();
    $componentType = ProductRelationType::where('code', 'component')->first();
    $cableType = ProductRelationType::where('code', 'cable')->first();

    $smartbatKit->relations()->create([
        'related_product_id' => $smartbat->id,
        'relation_type_id' => $componentType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '1',
        'is_visible_in_quote' => true,
        'is_visible_in_material_list' => true,
        'is_required_for_stock' => true,
        'order' => 1,
    ]);

    $smartbatKit->relations()->create([
        'related_product_id' => $cable->id,
        'relation_type_id' => $cableType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '1',
        'is_visible_in_quote' => false,
        'is_visible_in_material_list' => true,
        'is_required_for_stock' => true,
        'order' => 2,
    ]);

    $smartbatKit->relations()->create([
        'related_product_id' => $container->id,
        'relation_type_id' => $containerType->id,
        'quantity_type' => ProductRelationQuantityType::FORMULA,
        'quantity_value' => 'ceil(qty/6)',
        'is_visible_in_quote' => false,
        'is_visible_in_material_list' => false,
        'is_required_for_stock' => true,
        'order' => 3,
    ]);

    // Test calculate endpoint
    $response = $this->actingAs($this->user)
        ->postJson("/api/v1/products/{$smartbatKit->id}/relations/calculate", [
            'quantity' => 8,
        ]);

    $response->assertSuccessful();

    $data = $response->json('data');

    // Check LISTA 1: Quote (only smartbat)
    expect($data['quote'])->toHaveCount(1)
        ->and($data['quote'][0]['product_id'])->toBe($smartbat->id)
        ->and($data['quote'][0]['quantity'])->toBe(8)
        ->and(isset($data['quote'][1]))->toBeFalse()
        // Check LISTA 2: Material (8 smartbat + 8 cable)
        ->and($data['material'])->toHaveCount(2)
        ->and($data['material'][1]['product_id'])->toBe($cable->id)
        ->and($data['material'][1]['quantity'])->toBe(8)
        // Check LISTA 3: Stock (8 smartbat + 8 cable + 2 containers)
        ->and($data['stock'])->toHaveCount(3)
        ->and($data['stock'][1]['product_id'])->toBe($cable->id)
        ->and($data['stock'][2]['product_id'])->toBe($container->id)
        // ceil(8/6) = 2
        ->and($data['stock'][2]['quantity'])->toBe(2);
});

it('can get quote list for a product', function () {
    $category = ProductCategory::first();

    $product = Product::create([
        'code' => 'TEST-PROD',
        'name' => 'Test Product',
        'category_id' => $category->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 100.00,
        'sale_price' => 200.00,
    ]);

    $accessory = Product::create([
        'code' => 'TEST-ACC',
        'name' => 'Test Accessory',
        'category_id' => $category->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 10.00,
        'sale_price' => 20.00,
    ]);

    $accessoryType = ProductRelationType::where('code', 'accessory')->first();

    ProductRelation::create([
        'product_id' => $product->id,
        'related_product_id' => $accessory->id,
        'relation_type_id' => $accessoryType->id,
        'quantity_type' => ProductRelationQuantityType::FIXED,
        'quantity_value' => '2',
        'is_visible_in_quote' => true,
        'is_visible_in_material_list' => true,
        'is_required_for_stock' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/v1/products/{$product->id}/relations/quote-list?quantity=5");

    $response->assertSuccessful();

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['quantity'])->toBe(2); // Fixed quantity
});

it('can get material list for a product', function () {
    $category = ProductCategory::first();

    $product = Product::create([
        'code' => 'TEST-PROD2',
        'name' => 'Test Product 2',
        'category_id' => $category->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 100.00,
        'sale_price' => 200.00,
    ]);

    $component = Product::create([
        'code' => 'TEST-COMP',
        'name' => 'Test Component',
        'category_id' => $category->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 10.00,
        'sale_price' => 20.00,
    ]);

    $accessoryType = ProductRelationType::where('code', 'accessory')->first();

    ProductRelation::create([
        'product_id' => $product->id,
        'related_product_id' => $component->id,
        'relation_type_id' => $accessoryType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '0.5',
        'is_visible_in_quote' => false,
        'is_visible_in_material_list' => true,
        'is_required_for_stock' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/v1/products/{$product->id}/relations/material-list?quantity=10");

    $response->assertSuccessful();

    $data = $response->json('data');
    expect($data)->toHaveCount(1)
        ->and($data[0]['quantity'])->toBe(5); // 10 * 0.5
});

it('can get stock list including containers', function () {
    $category = ProductCategory::first();
    $containerCategory = ProductCategory::where('code', 'containers')->first();

    $product = Product::create([
        'code' => 'TEST-PROD3',
        'name' => 'Test Product 3',
        'category_id' => $category->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 100.00,
        'sale_price' => 200.00,
    ]);

    $container = Product::create([
        'code' => 'TEST-BOX',
        'name' => 'Test Box',
        'category_id' => $containerCategory->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 50.00,
        'sale_price' => 0.00,
    ]);

    $containerType = ProductRelationType::where('code', 'container')->first();

    ProductRelation::create([
        'product_id' => $product->id,
        'related_product_id' => $container->id,
        'relation_type_id' => $containerType->id,
        'quantity_type' => ProductRelationQuantityType::FORMULA,
        'quantity_value' => 'ceil(qty/10)',
        'is_visible_in_quote' => false,
        'is_visible_in_material_list' => false,
        'is_required_for_stock' => true, // Only in stock
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/v1/products/{$product->id}/relations/stock-list?quantity=25");

    $response->assertSuccessful();

    $data = $response->json('data');
    expect($data)->toHaveCount(1)
        ->and($data[0]['quantity'])->toBe(3); // ceil(25/10) = 3
});
