<?php

use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductBrand;
use App\Domains\Product\Models\ProductCategory;
use App\Models\DiscountFamily;
use App\Models\PaymentTerm;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    // Seed roles and permissions
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

    // Create admin user with permissions
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    Sanctum::actingAs($this->admin);

    // Create test supplier
    $this->supplier = Supplier::create([
        'code' => 'SUP-001',
        'company_name' => 'Fornitore Test',
        'is_active' => true,
    ]);

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

    // Create discount family
    $this->discountFamily = DiscountFamily::create([
        'supplier_id' => $this->supplier->id,
        'code' => 'COM1',
        'name' => 'Commerciale 1',
        'discount_1' => 10.00,
        'discount_2' => 5.00,
        'discount_3' => 2.00,
        'is_active' => true,
    ]);

    // Create payment term
    $this->paymentTerm = PaymentTerm::create([
        'code' => 'NET30',
        'name' => 'Net 30 days',
        'days' => 30,
        'is_active' => true,
    ]);
});

it('imports supplier catalog with basic data (product + supplier_product)', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => '010',
                'name' => 'Interruttore Magnetotermico 10A',
                'unit' => 'pz',
                'purchase_price' => 12.50,
            ],
        ],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'imported' => 1,
                'updated' => 0,
                'skipped' => 0,
            ],
        ]);

    // Verify product created
    $product = Product::where('code', '010')->first();
    expect($product)->not->toBeNull()
        ->and($product->name)->toBe('Interruttore Magnetotermico 10A')
        ->and($product->unit)->toBe('pz');

    // Verify supplier_product created
    $supplierProduct = SupplierProduct::where('product_id', $product->id)
        ->where('supplier_id', $this->supplier->id)
        ->first();
    expect($supplierProduct)->not->toBeNull()
        ->and((float) $supplierProduct->purchase_price)->toBe(12.50);
});

it('imports with brand resolution (code)', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => '010',
                'name' => 'Pulsante Illuminabile',
                'unit' => 'pz',
                'brand' => 'BTI',
                'purchase_price' => 120.00,
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', '010')->first();
    expect($product->brand_id)->toBe($this->brandBti->id);
});

it('imports with brand resolution (name)', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => '020',
                'name' => 'Presa 2P+T',
                'unit' => 'pz',
                'brand' => 'BTicino',
                'purchase_price' => 8.50,
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', '020')->first();
    expect($product->brand_id)->toBe($this->brandBti->id);
});

it('creates new brand if not found', function () {
    $brandCountBefore = ProductBrand::count();

    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => '030',
                'name' => 'Prodotto Nuovo Brand',
                'unit' => 'pz',
                'brand' => 'New Brand XYZ',
                'purchase_price' => 50.00,
            ],
        ],
    ]);

    $response->assertStatus(200);

    expect(ProductBrand::count())->toBe($brandCountBefore + 1);

    $newBrand = ProductBrand::where('name', 'New Brand XYZ')->first();
    expect($newBrand)->not->toBeNull()
        ->and($newBrand->is_active)->toBeTrue();

    $product = Product::where('code', '030')->first();
    expect($product->brand_id)->toBe($newBrand->id);
});

it('imports with category resolution', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => '040',
                'name' => 'Prodotto Elettrico',
                'unit' => 'pz',
                'category' => 'ELETT',
                'purchase_price' => 25.00,
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', '040')->first();
    expect($product->category_id)->toBe($this->categoryElectric->id);
});

it('imports with supplier_product specific fields', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => '050',
                'name' => 'Prodotto Completo',
                'unit' => 'pz',
                'purchase_price' => 120.00,
                'wholesale_price' => 150.00,
                'retail_price' => 200.00,
                'supplier_product_code' => 'BTI-050',
                'supplier_ean' => '8014496006615',
                'package_quantity' => 6,
                'minimum_order_quantity' => 6,
                'maximum_order_quantity' => 999999,
                'multiple_order_quantity' => 6,
                'lead_time_days' => 7,
                'price_multiplier' => 1.0,
                'currency' => 'EUR',
                'is_active' => true,
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', '050')->first();
    $supplierProduct = SupplierProduct::where('product_id', $product->id)->first();

    expect($supplierProduct)->not->toBeNull()
        ->and((float) $supplierProduct->purchase_price)->toBe(120.00)
        ->and((float) $supplierProduct->wholesale_price)->toBe(150.00)
        ->and((float) $supplierProduct->retail_price)->toBe(200.00)
        ->and($supplierProduct->supplier_product_code)->toBe('BTI-050')
        ->and($supplierProduct->supplier_ean)->toBe('8014496006615')
        ->and($supplierProduct->package_quantity)->toBe(6)
        ->and($supplierProduct->minimum_order_quantity)->toBe(6)
        ->and($supplierProduct->lead_time_days)->toBe(7)
        ->and($supplierProduct->currency)->toBe('EUR');
});

it('imports with discount family resolution', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => '060',
                'name' => 'Prodotto con Famiglia Sconto',
                'unit' => 'pz',
                'purchase_price' => 100.00,
                'discount_family' => 'COM1',
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', '060')->first();
    $supplierProduct = SupplierProduct::where('product_id', $product->id)->first();

    expect($supplierProduct->discount_family_id)->toBe($this->discountFamily->id);
});

it('imports with manual discounts', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => '070',
                'name' => 'Prodotto con Sconti Manuali',
                'unit' => 'pz',
                'purchase_price' => 100.00,
                'manual_discount_1' => 10.00,
                'manual_discount_2' => 5.00,
                'manual_discount_3' => 2.00,
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product = Product::where('code', '070')->first();
    $supplierProduct = SupplierProduct::where('product_id', $product->id)->first();

    expect((float) $supplierProduct->manual_discount_1)->toBe(10.00)
        ->and((float) $supplierProduct->manual_discount_2)->toBe(5.00)
        ->and((float) $supplierProduct->manual_discount_3)->toBe(2.00);
});

it('updates existing product and supplier_product', function () {
    // Create existing product
    $product = Product::factory()->create(['code' => 'EXIST-001', 'name' => 'Old Name']);

    // Create existing supplier_product
    SupplierProduct::create([
        'supplier_id' => $this->supplier->id,
        'product_id' => $product->id,
        'purchase_price' => 50.00,
    ]);

    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => 'EXIST-001',
                'name' => 'Updated Name',
                'unit' => 'pz',
                'purchase_price' => 75.00,
            ],
        ],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'imported' => 0,
                'updated' => 1,
                'skipped' => 0,
            ],
        ]);

    $product->refresh();
    expect($product->name)->toBe('Updated Name');

    $supplierProduct = SupplierProduct::where('product_id', $product->id)->first();
    expect((float) $supplierProduct->purchase_price)->toBe(75.00);
});

it('imports multiple rows in batch', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => 'BATCH-001',
                'name' => 'Prodotto Batch 1',
                'unit' => 'pz',
                'purchase_price' => 10.00,
            ],
            [
                'code' => 'BATCH-002',
                'name' => 'Prodotto Batch 2',
                'unit' => 'pz',
                'purchase_price' => 20.00,
            ],
            [
                'code' => 'BATCH-003',
                'name' => 'Prodotto Batch 3',
                'unit' => 'pz',
                'purchase_price' => 30.00,
            ],
        ],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'imported' => 3,
                'updated' => 0,
                'skipped' => 0,
            ],
        ]);

    expect(Product::whereIn('code', ['BATCH-001', 'BATCH-002', 'BATCH-003'])->count())->toBe(3);
    expect(SupplierProduct::where('supplier_id', $this->supplier->id)->count())->toBe(3);
});

it('handles errors gracefully and reports them', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => 'VALID-001',
                'name' => 'Valid Product',
                'unit' => 'pz',
                'purchase_price' => 10.00,
            ],
            [
                // Missing code (required)
                'name' => 'Invalid Product',
                'unit' => 'pz',
                'purchase_price' => 20.00,
            ],
        ],
    ]);

    // Validation will catch the entire batch
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['rows.1.code']);
});

it('requires authentication', function () {
    Sanctum::actingAs(User::factory()->create());

    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [],
    ]);

    $response->assertStatus(403); // Forbidden without permission
});

it('validates required fields', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                // Missing code
                'name' => 'Product Without Code',
                'purchase_price' => 10.00,
            ],
        ],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['rows.0.code']);
});

it('simulates real Excel import (BTicino format)', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'brand' => 'BTI',
                'code' => '010',
                'supplier_ean' => '8014496006615',
                'name' => 'pulsanti - pulsante illuminabile con targa',
                'package_quantity' => 6,
                'multiple_order_quantity' => 6,
                'minimum_order_quantity' => 6,
                'maximum_order_quantity' => 999999,
                'lead_time_days' => 1,
                'wholesale_price' => 120.00,
                'retail_price' => 120.00,
                'price_multiplier' => 1.0,
                'currency' => 'EUR',
                'unit' => 'pz',
                'purchase_price' => 100.00,
                'discount_family' => 'COM1',
                'etim_code' => 'EC001351',
            ],
        ],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'imported' => 1,
            ],
        ]);

    $product = Product::where('code', '010')->first();
    expect($product)->not->toBeNull()
        ->and($product->brand_id)->toBe($this->brandBti->id)
        ->and($product->unit)->toBe('pz')
        ->and($product->etim_code)->toBe('EC001351');

    $supplierProduct = SupplierProduct::where('product_id', $product->id)->first();
    expect($supplierProduct)->not->toBeNull()
        ->and((float) $supplierProduct->purchase_price)->toBe(100.00)
        ->and((float) $supplierProduct->wholesale_price)->toBe(120.00)
        ->and((float) $supplierProduct->retail_price)->toBe(120.00)
        ->and($supplierProduct->package_quantity)->toBe(6)
        ->and($supplierProduct->discount_family_id)->toBe($this->discountFamily->id)
        ->and($supplierProduct->currency)->toBe('EUR');
});

it('sanitizes non-numeric lead_time_days to default value', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => 'LEAD-001',
                'name' => 'Product with alphabetic lead time',
                'unit' => 'pz',
                'purchase_price' => 50.00,
                'lead_time_days' => 'ABC', // Non-numeric value
            ],
        ],
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'imported' => 1,
            ],
        ]);

    $product = Product::where('code', 'LEAD-001')->first();
    $supplierProduct = SupplierProduct::where('product_id', $product->id)->first();

    // Should be sanitized to default (7 days)
    expect($supplierProduct)->not->toBeNull()
        ->and($supplierProduct->lead_time_days)->toBe(7);
});

it('preserves numeric lead_time_days values', function () {
    $response = $this->postJson('/api/v1/import/supplier-catalog', [
        'supplier_id' => $this->supplier->id,
        'rows' => [
            [
                'code' => 'LEAD-002',
                'name' => 'Product with numeric lead time',
                'unit' => 'pz',
                'purchase_price' => 50.00,
                'lead_time_days' => '14', // String numeric value
            ],
            [
                'code' => 'LEAD-003',
                'name' => 'Product with integer lead time',
                'unit' => 'pz',
                'purchase_price' => 60.00,
                'lead_time_days' => 21, // Integer value
            ],
        ],
    ]);

    $response->assertStatus(200);

    $product1 = Product::where('code', 'LEAD-002')->first();
    $supplierProduct1 = SupplierProduct::where('product_id', $product1->id)->first();
    expect($supplierProduct1->lead_time_days)->toBe(14);

    $product2 = Product::where('code', 'LEAD-003')->first();
    $supplierProduct2 = SupplierProduct::where('product_id', $product2->id)->first();
    expect($supplierProduct2->lead_time_days)->toBe(21);
});
