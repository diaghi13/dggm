<?php

use App\Models\Product;
use App\Models\ProductBrand;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    // Seed roles and permissions
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

    // Create admin user with permissions
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    Sanctum::actingAs($this->admin);

    // Create test brands
    $this->brandBti = ProductBrand::create([
        'code' => 'BTI',
        'name' => 'BTicino',
        'is_active' => true,
    ]);

    $this->brandVimar = ProductBrand::create([
        'code' => 'VMR',
        'name' => 'Vimar',
        'is_active' => true,
    ]);

    // Create test categories
    $this->categoryElectric = ProductCategory::create([
        'code' => 'ELETT',
        'name' => 'Elettrico',
    ]);

    $this->categoryPlumbing = ProductCategory::create([
        'code' => 'IDRAU',
        'name' => 'Idraulico',
    ]);
});

it('imports products successfully with basic data', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-001',
                'name' => 'Test Product 1',
                'unit' => 'pcs',
                'price' => 10.50,
                'cost' => 5.25,
            ],
            [
                'code' => 'PROD-002',
                'name' => 'Test Product 2',
                'unit' => 'mt',
                'price' => 20.00,
                'cost' => 10.00,
            ],
        ],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'imported' => 2,
                'skipped' => 0,
            ],
        ]);

    expect(Product::count())->toBe(2)
        ->and(Product::where('code', 'PROD-001')->exists())->toBeTrue()
        ->and(Product::where('code', 'PROD-002')->exists())->toBeTrue();
});

it('resolves brand by ID', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-003',
                'name' => 'Product with Brand ID',
                'unit' => 'pcs',
                'brand' => $this->brandBti->id,
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', 'PROD-003')->first();
    expect($product)->not->toBeNull()
        ->and($product->brand_id)->toBe($this->brandBti->id);
});

it('resolves brand by code', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-004',
                'name' => 'Product with Brand Code',
                'unit' => 'pcs',
                'brand' => 'BTI',
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', 'PROD-004')->first();
    expect($product)->not->toBeNull()
        ->and($product->brand_id)->toBe($this->brandBti->id);
});

it('resolves brand by name', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-005',
                'name' => 'Product with Brand Name',
                'unit' => 'pcs',
                'brand' => 'BTicino',
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', 'PROD-005')->first();
    expect($product)->not->toBeNull()
        ->and($product->brand_id)->toBe($this->brandBti->id);
});

it('creates new brand if not found', function () {
    $brandCountBefore = ProductBrand::count();

    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-006',
                'name' => 'Product with New Brand',
                'unit' => 'pcs',
                'brand' => 'New Brand XYZ',
            ],
        ],
    ]);

    $response->assertStatus(200);

    expect(ProductBrand::count())->toBe($brandCountBefore + 1);

    $newBrand = ProductBrand::where('name', 'New Brand XYZ')->first();
    expect($newBrand)->not->toBeNull()
        ->and($newBrand->is_active)->toBeTrue();

    $product = Product::where('code', 'PROD-006')->first();
    expect($product->brand_id)->toBe($newBrand->id);
});

it('resolves category by ID', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-007',
                'name' => 'Product with Category ID',
                'unit' => 'pcs',
                'category' => $this->categoryElectric->id,
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', 'PROD-007')->first();
    expect($product)->not->toBeNull()
        ->and($product->category_id)->toBe($this->categoryElectric->id);
});

it('resolves category by code', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-008',
                'name' => 'Product with Category Code',
                'unit' => 'pcs',
                'category' => 'ELETT',
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', 'PROD-008')->first();
    expect($product)->not->toBeNull()
        ->and($product->category_id)->toBe($this->categoryElectric->id);
});

it('resolves category by name', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-009',
                'name' => 'Product with Category Name',
                'unit' => 'pcs',
                'category' => 'Elettrico',
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', 'PROD-009')->first();
    expect($product)->not->toBeNull()
        ->and($product->category_id)->toBe($this->categoryElectric->id);
});

it('does not create new category if not found', function () {
    $categoryCountBefore = ProductCategory::count();

    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-010',
                'name' => 'Product with Non-Existent Category',
                'unit' => 'pcs',
                'category' => 'Non-Existent Category',
            ],
        ],
    ]);

    $response->assertStatus(200);

    // Category count should remain the same
    expect(ProductCategory::count())->toBe($categoryCountBefore);

    // Product should be created with null category_id
    $product = Product::where('code', 'PROD-010')->first();
    expect($product)->not->toBeNull()
        ->and($product->category_id)->toBeNull();
});

it('skips duplicate products and reports them', function () {
    // Create existing product
    Product::factory()->create(['code' => 'PROD-DUP']);

    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-DUP',
                'name' => 'Duplicate Product',
                'unit' => 'pcs',
            ],
            [
                'code' => 'PROD-NEW',
                'name' => 'New Product',
                'unit' => 'pcs',
            ],
        ],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'imported' => 1,
                'skipped' => 1,
            ],
        ]);

    expect($response->json('data.errors'))->toHaveCount(1)
        ->and($response->json('data.errors.0'))->toContain('PROD-DUP')
        ->and($response->json('data.errors.0'))->toContain('già esistente');
});

it('imports products with mixed brand and category formats', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-MIX-01',
                'name' => 'Mixed Format 1',
                'unit' => 'pcs',
                'brand' => 'BTI',          // Code
                'category' => $this->categoryElectric->id,  // ID
            ],
            [
                'code' => 'PROD-MIX-02',
                'name' => 'Mixed Format 2',
                'unit' => 'pcs',
                'brand' => 'Vimar',        // Name
                'category' => 'IDRAU',     // Code
            ],
            [
                'code' => 'PROD-MIX-03',
                'name' => 'Mixed Format 3',
                'unit' => 'pcs',
                'brand' => $this->brandBti->id,  // ID
                'category' => 'Idraulico',       // Name
            ],
        ],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'imported' => 3,
                'skipped' => 0,
            ],
        ]);

    // Verify first product
    $product1 = Product::where('code', 'PROD-MIX-01')->first();
    expect($product1->brand_id)->toBe($this->brandBti->id)
        ->and($product1->category_id)->toBe($this->categoryElectric->id);

    // Verify second product
    $product2 = Product::where('code', 'PROD-MIX-02')->first();
    expect($product2->brand_id)->toBe($this->brandVimar->id)
        ->and($product2->category_id)->toBe($this->categoryPlumbing->id);

    // Verify third product
    $product3 = Product::where('code', 'PROD-MIX-03')->first();
    expect($product3->brand_id)->toBe($this->brandBti->id)
        ->and($product3->category_id)->toBe($this->categoryPlumbing->id);
});

it('validates required fields', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                // Missing 'code' (required)
                'name' => 'Invalid Product',
            ],
        ],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['products.0.code']);
});

it('handles import errors gracefully', function () {
    $response = $this->postJson('/api/v1/products/import', [
        'products' => [
            [
                'code' => 'PROD-VALID',
                'name' => 'Valid Product',
                'unit' => 'pcs',
            ],
            [
                'code' => 'PROD-INVALID',
                'name' => 'Invalid Product',
                'unit' => 'pcs',
                'price' => -10,  // Invalid negative price (caught by validation)
            ],
        ],
    ]);

    // Validation will catch the entire batch
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['products.1.price']);
});

it('requires authentication for import', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->postJson('/api/v1/products/import', [
        'products' => [],
    ]);

    $response->assertStatus(403); // Forbidden without permission
});
