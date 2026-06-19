<?php

use App\Domains\Product\Data\ProductData;
use App\Domains\Product\Enums\ProductRelationQuantityType;
use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductRelation;
use App\Domains\Product\Models\ProductRelationType;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    // Create test supplier
    $this->supplier = Supplier::factory()->create([
        'company_name' => 'Test Supplier',
        'is_active' => true,
    ]);

    // Create test products
    $this->article = Product::factory()->create([
        'code' => 'ART-001',
        'name' => 'Test Article',
        'product_type' => ProductType::ARTICLE,
        'purchase_price' => 100.00,
        'markup_percentage' => 20.00,
        'sale_price' => 120.00,
        'default_supplier_id' => $this->supplier->id,
    ]);

    $this->service = Product::factory()->create([
        'code' => 'SRV-001',
        'name' => 'Test Service',
        'product_type' => ProductType::SERVICE,
        'purchase_price' => 50.00,
        'sale_price' => 75.00,
    ]);

    $this->composite = Product::factory()->create([
        'code' => 'CMP-001',
        'name' => 'Test Composite',
        'product_type' => ProductType::COMPOSITE,
    ]);
});

it('creates ProductData from model using WithData trait', function () {
    $productData = ProductData::from($this->article);

    expect($productData)->toBeInstanceOf(ProductData::class)
        ->and($productData->id)->toBe($this->article->id)
        ->and($productData->code)->toBe('ART-001')
        ->and($productData->name)->toBe('Test Article')
        ->and($productData->product_type)->toBe(ProductType::ARTICLE);
});

it('validates required fields using validation attributes', function () {
    expect(fn () => ProductData::validate([
        'name' => 'Test Product',
        // Missing required 'code' field
    ]))->toThrow(ValidationException::class);
});

it('computes calculated_sale_price from markup', function () {
    $productData = ProductData::from($this->article);

    expect($productData->calculated_sale_price)->toBe(120.00);
});

it('lazy loads relations only when loaded from Eloquent', function () {
    // Create a relation type for components
    $componentRelationType = ProductRelationType::firstOrCreate([
        'code' => 'component',
    ], [
        'name' => 'Component',
        'description' => 'Product component',
    ]);

    // Add relations to composite
    ProductRelation::create([
        'product_id' => $this->composite->id,
        'related_product_id' => $this->article->id,
        'relation_type_id' => $componentRelationType->id,
        'quantity_type' => ProductRelationQuantityType::FIXED,
        'quantity_value' => '2',
    ]);

    ProductRelation::create([
        'product_id' => $this->composite->id,
        'related_product_id' => $this->service->id,
        'relation_type_id' => $componentRelationType->id,
        'quantity_type' => ProductRelationQuantityType::FIXED,
        'quantity_value' => '1',
    ]);

    // Test 1: Load product WITHOUT eager loading relations - use fromModel for proper Lazy
    $composite = Product::find($this->composite->id);
    $productData = ProductData::fromModel($composite);

    // Relations should NOT be in the output (Lazy::whenLoaded)
    $array = $productData->toArray();
    expect($array)->not->toHaveKey('relations');

    // Test 2: Load product WITH eager loaded relations - use fromModel for proper Lazy
    $compositeWithRelations = Product::with('relations.relatedProduct')->find($this->composite->id);
    $productDataWithRelations = ProductData::fromModel($compositeWithRelations);

    // Relations should NOW be in the output (Lazy::whenLoaded detects eager load)
    $arrayWithRelations = $productDataWithRelations->toArray();
    expect($arrayWithRelations)->toHaveKey('relations')
        ->and($arrayWithRelations['relations'])->toHaveCount(2);

    // Verify the relations data in the array
    $firstRelation = $arrayWithRelations['relations'][0];
    expect($firstRelation)->toBeArray()
        ->and($firstRelation['product_id'])->toBe($this->composite->id)
        ->and($firstRelation['related_product_id'])->toBeIn([$this->article->id, $this->service->id]);
});

// it('computes composite_total_cost for composite products', function () {
//    // Add components to composite
//    ProductComponent::factory()->create([
//        'kit_material_id' => $this->composite->id,
//        'component_material_id' => $this->article->id,
//        'quantity' => 2, // 2 x 100 = 200
//    ]);
//
//    ProductComponent::factory()->create([
//        'kit_material_id' => $this->composite->id,
//        'component_material_id' => $this->service->id,
//        'quantity' => 3, // 3 x 50 = 150
//    ]);
//
//    // Load with components
//    $compositeWithComponents = Product::with('components.componentProduct')->find($this->composite->id);
//    $productData = ProductData::from($compositeWithComponents)->include('components', 'composite_total_cost');
//
//    // Total cost should be 350 (200 + 150)
//    expect($productData->composite_total_cost())->toBe(350.00);
// });
//
// it('returns empty DataCollection for components when product is not composite', function () {
//    $productData = ProductData::from($this->article);
//
//    expect($productData->canHaveComponents())->toBeFalse()
//        ->and($productData->components())->toHaveCount(0);
// });
//
// it('lazy loads default supplier', function () {
//    // Load product without supplier
//    $product = Product::find($this->article->id);
//    $productData = ProductData::from($product);
//
//    // Supplier should not be loaded by default
//    expect($productData->toArray())->not->toHaveKey('defaultSupplier');
//
//    // Now load with supplier
//    $productWithSupplier = Product::with('defaultSupplier')->find($this->article->id);
//    $productDataWithSupplier = ProductData::from($productWithSupplier)->include('defaultSupplier');
//
//    // Supplier should be loaded
//    expect($productDataWithSupplier->toArray())
//        ->toHaveKey('defaultSupplier')
//        ->and($productDataWithSupplier->defaultSupplier())->toBeInstanceOf(SupplierData::class)
//        ->and($productDataWithSupplier->defaultSupplier()->company_name)->toBe('Test Supplier');
// });
//
// it('checks if product can have components based on type', function () {
//    $articleData = ProductData::from($this->article);
//    $serviceData = ProductData::from($this->service);
//    $compositeData = ProductData::from($this->composite);
//
//    expect($articleData->canHaveComponents())->toBeFalse()
//        ->and($serviceData->canHaveComponents())->toBeFalse()
//        ->and($compositeData->canHaveComponents())->toBeTrue();
// });
//
// it('checks if product is inventoriable based on type', function () {
//    $articleData = ProductData::from($this->article);
//    $serviceData = ProductData::from($this->service);
//    $compositeData = ProductData::from($this->composite);
//
//    expect($articleData->isInventoriable())->toBeTrue()
//        ->and($serviceData->isInventoriable())->toBeFalse()
//        ->and($compositeData->isInventoriable())->toBeFalse();
// });
//
// it('checks if product is a service', function () {
//    $articleData = ProductData::from($this->article);
//    $serviceData = ProductData::from($this->service);
//
//    expect($articleData->isService())->toBeFalse()
//        ->and($serviceData->isService())->toBeTrue();
// });
//
// it('returns human-readable product type label', function () {
//    $articleData = ProductData::from($this->article);
//    $serviceData = ProductData::from($this->service);
//    $compositeData = ProductData::from($this->composite);
//
//    expect($articleData->productTypeLabel())->toBe('Articolo')
//        ->and($serviceData->productTypeLabel())->toBe('Servizio')
//        ->and($compositeData->productTypeLabel())->toBe('Prodotto Composto');
// });
//
// it('creates SupplierData from model using WithData trait', function () {
//    $supplierData = SupplierData::from($this->supplier);
//
//    expect($supplierData)->toBeInstanceOf(SupplierData::class)
//        ->and($supplierData->id)->toBe($this->supplier->id)
//        ->and($supplierData->company_name)->toBe('Test Supplier')
//        ->and($supplierData->is_active)->toBeTrue();
// });
//
// it('computes full_address for supplier', function () {
//    $supplier = Supplier::factory()->create([
//        'address' => 'Via Roma 123',
//        'postal_code' => '20100',
//        'city' => 'Milano',
//        'province' => 'MI',
//        'country' => 'Italy',
//    ]);
//
//    $supplierData = SupplierData::from($supplier);
//
//    expect($supplierData->full_address())->toBe('Via Roma 123, 20100, Milano, (MI)');
// });
//
// it('creates ProductComponentData with lazy loaded products', function () {
//    $component = ProductComponent::factory()->create([
//        'kit_material_id' => $this->composite->id,
//        'component_material_id' => $this->article->id,
//        'quantity' => 5,
//    ]);
//
//    // Load without products
//    $componentData = ProductComponentData::from($component);
//
//    expect($componentData->quantity)->toBe(5.0);
//
//    // Load with products
//    $componentWithProducts = ProductComponent::with(['kitProduct', 'componentProduct'])->find($component->id);
//    $componentDataWithProducts = ProductComponentData::from($componentWithProducts)
//        ->include('component_product', 'kit_product', 'total_cost');
//
//    expect($componentDataWithProducts->component_product())->toBeInstanceOf(ProductData::class)
//        ->and($componentDataWithProducts->kit_product())->toBeInstanceOf(ProductData::class)
//        ->and($componentDataWithProducts->total_cost())->toBe(500.00); // 5 x 100
// });
//
// it('validates ProductComponentData with Exists attributes', function () {
//    expect(fn () => ProductComponentData::validate([
//        'kit_product_id' => 99999, // Non-existent product
//        'component_product_id' => $this->article->id,
//        'quantity' => 1,
//    ]))->toThrow(ValidationException::class);
// });
