# Spatie Laravel Data v4 - Best Practices

This document outlines the best practices for using Spatie Laravel Data v4 in the DGGM ERP project. These practices are implemented in `ProductData`, `SupplierData`, and `ProductComponentData`.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Data Class Structure](#data-class-structure)
3. [Validation Attributes](#validation-attributes)
4. [Lazy Properties](#lazy-properties)
5. [Computed Properties](#computed-properties)
6. [DataCollection](#datacollection)
7. [Optional Type](#optional-type)
8. [WithData Trait](#withdata-trait)
9. [Usage in Services](#usage-in-services)
10. [Usage in Controllers](#usage-in-controllers)
11. [Common Patterns](#common-patterns)

---

## Installation & Setup

```bash
composer require spatie/laravel-data
```

Configuration file (optional):
```bash
php artisan vendor:publish --provider="Spatie\LaravelData\LaravelDataServiceProvider" --tag="config"
```

---

## Data Class Structure

### Basic Structure

```php
<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Max;

/**
 * Example Data Transfer Object
 *
 * Always include comprehensive PHPDoc explaining:
 * - Purpose of the DTO
 * - Key features used (validation, lazy, computed)
 * - Usage examples if complex
 */
class ExampleData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required]
        #[Max(255)]
        public string $name,

        public string|Optional|null $description,
    ) {}
}
```

### Key Rules

1. **Always extend `Spatie\LaravelData\Data`**
2. **Use constructor property promotion** (PHP 8 syntax)
3. **Add comprehensive PHPDoc** to explain the DTO
4. **Group properties logically** (primary fields, relationships, computed, timestamps)
5. **Use proper type hints** (`int`, `string`, `bool`, `ProductType`, `Optional`, etc.)

---

## Validation Attributes

Replace FormRequests with validation attributes directly on Data properties.

### Available Attributes

```php
use Spatie\LaravelData\Attributes\Validation\*;

#[Required]                              // Field is required
#[Max(255)]                              // Max length/value
#[Min(0)]                                // Min value
#[Email]                                 // Valid email
#[Unique('products', 'code')]            // Unique in table.column
#[Exists('suppliers', 'id')]             // Exists in table.column
#[In(['draft', 'published'])]            // Value must be in list
#[Regex('/^[A-Z]{3}-[0-9]{5}$/')]       // Regex pattern
```

### Example from ProductData

```php
#[Required]
#[Max(255)]
#[Unique('products', 'code')]
public string $code,

#[Min(0)]
#[Max(100)]
public float $markup_percentage,

#[Exists('suppliers', 'id')]
public int|Optional|null $default_supplier_id,
```

### Validation in Action

```php
// In Controller
try {
    $productDto = ProductData::validate($request->all());
    // Data is valid and converted to DTO
} catch (ValidationException $e) {
    // Validation failed
    return response()->json(['errors' => $e->errors()], 422);
}
```

**Benefits:**
- ✅ Validation logic co-located with data structure
- ✅ No separate FormRequest classes needed
- ✅ Automatic validation when using `::validate()`
- ✅ Type-safe validated data

---

## Lazy Properties

Lazy properties are **NOT loaded by default**. They must be explicitly requested with `->include()`.

### When to Use Lazy Properties

Use lazy properties for:
- **Expensive relationships** (requires database query)
- **Large nested data** (avoid overfetching)
- **Optional data** (not always needed)

### Example from ProductData

```php
/**
 * Components relationship (Lazy loaded)
 *
 * Only included when explicitly requested with ->include('components')
 * or when 'components' relationship is eager loaded on the model
 */
#[Lazy]
public function components(): DataCollection
{
    if (! $this->canHaveComponents()) {
        return ProductComponentData::collection([]);
    }

    // If loaded from model, components will be available
    return ProductComponentData::collection(
        $this->resource?->components ?? []
    );
}
```

### Usage

```php
// WITHOUT lazy properties (default)
$productData = ProductData::from($product);
$array = $productData->toArray();
// Result: { id, code, name, ... } - NO components

// WITH lazy properties
$product = Product::with('components.componentProduct')->find($id);
$productData = ProductData::from($product)->include('components');
$array = $productData->toArray();
// Result: { id, code, name, ..., components: [...] }

// Include multiple lazy properties
$productData->include('components', 'defaultSupplier', 'inventory');
```

**Best Practices:**
- Always check if relationship is loaded (`$this->resource?->relationLoaded('components')`)
- Return `Optional::create()` if data isn't available
- Eager load relationships on the model BEFORE converting to DTO
- Use lazy for ALL relationships to avoid N+1 queries

---

## Computed Properties

Computed properties are **automatically calculated** from other properties.

### When to Use Computed Properties

Use computed properties for:
- **Derived values** (calculated from other fields)
- **Formatted data** (full address, display names)
- **Business logic** (total cost, availability status)

### Example from ProductData

```php
/**
 * Calculate sale price based on markup (Computed)
 *
 * Automatically calculated from purchase_price and markup_percentage
 */
#[Computed]
public function calculated_sale_price(): float
{
    if ($this->markup_percentage > 0) {
        return round($this->purchase_price * (1 + ($this->markup_percentage / 100)), 2);
    }

    return $this->sale_price;
}
```

### Computed + Lazy

You can combine `#[Computed]` and `#[Lazy]` for expensive calculated values:

```php
/**
 * Total cost for composite products (Computed + Lazy)
 *
 * Only calculated for COMPOSITE products and when components are loaded
 */
#[Computed]
#[Lazy]
public function composite_total_cost(): float
{
    if (! $this->canHaveComponents()) {
        return 0;
    }

    if ($this->components instanceof Optional) {
        return 0;
    }

    return $this->components->sum(fn (ProductComponentData $component) =>
        $component->calculateCost()
    );
}
```

**Usage:**

```php
$productData = ProductData::from($product);

// Computed properties are always available (NOT lazy)
echo $productData->calculated_sale_price(); // ✅ Always works

// Computed + Lazy must be included
$productData = ProductData::from($product)->include('composite_total_cost');
echo $productData->composite_total_cost(); // ✅ Works because included
```

**Best Practices:**
- Keep logic simple and fast
- For expensive calculations, combine with `#[Lazy]`
- Always handle edge cases (division by zero, null values)
- Return proper types (don't return null for `float`)

---

## DataCollection

`DataCollection` is a type-safe collection of Data objects.

### Example from ProductData

```php
#[Lazy]
public function components(): DataCollection
{
    return ProductComponentData::collection(
        $this->resource?->components ?? []
    );
}
```

### Usage

```php
$productData = ProductData::from($product)->include('components');

// DataCollection is iterable
foreach ($productData->components() as $component) {
    echo $component->quantity; // Type-safe ProductComponentData
}

// DataCollection methods
$productData->components()->count();
$productData->components()->sum(fn($c) => $c->total_cost());
$productData->components()->toArray();
```

**Benefits:**
- ✅ Type-safe iteration
- ✅ IDE autocomplete for nested Data objects
- ✅ Collection methods (map, filter, sum, etc.)

---

## Optional Type

The `Optional` type represents a value that may not be present.

### When to Use Optional

```php
// For nullable fields
public string|Optional|null $description,

// For optional IDs (can be missing on create)
public int|Optional $id,

// For optional relationships
public SupplierData|Optional $defaultSupplier,
```

### Checking for Optional

```php
if ($this->defaultSupplier instanceof Optional) {
    // Value is not present
    return null;
}

// Value is present and is SupplierData
return $this->defaultSupplier->company_name;
```

### Creating Optional

```php
return Optional::create(); // Empty optional value
```

**Best Practices:**
- Use `Optional` for fields that can be missing (not just `null`)
- Always check `instanceof Optional` before using the value
- For `int|Optional $id`, use when ID is auto-generated on create
- For `Model|Optional`, use for lazy-loaded relationships

---

## WithData Trait

The `WithData` trait enables automatic model-to-DTO conversion.

### Setup on Model

```php
use Spatie\LaravelData\WithData;

class Product extends Model
{
    use WithData;

    protected string $dataClass = ProductData::class;
}
```

### Usage

```php
// Automatic conversion via getData()
$product = Product::find(1);
$productData = $product->getData(); // Returns ProductData

// Or use from() method
$productData = ProductData::from($product);
```

**Benefits:**
- ✅ Consistent model → DTO conversion
- ✅ Single source of truth for DTO class
- ✅ Works with collections: `Product::all()->getData()`

---

## Usage in Services

Services should **accept DTOs or arrays** and **return DTOs**.

### Example from ProductService

```php
/**
 * Create a new product (accepts array or DTO, returns DTO)
 */
public function create(array|ProductData $data): ProductData
{
    // Convert to array if DTO is passed
    $dataArray = $data instanceof ProductData ? $data->toArray() : $data;

    return DB::transaction(function () use ($dataArray) {
        $product = Product::query()->create($dataArray);

        return ProductData::from($product->fresh());
    });
}

/**
 * Get a single product (returns DTO)
 */
public function getById(int $id): ProductData
{
    $product = Product::with([
        'defaultSupplier',
        'components.componentProduct',
    ])->findOrFail($id);

    return ProductData::from($product);
}
```

**Best Practices:**
- Accept `array|ProductData` for flexibility
- Always return DTOs (not models)
- Eager load relationships before converting to DTO
- Use `->fresh()` after creation to get complete data

---

## Usage in Controllers

Controllers should **validate with DTOs** and **return DTO arrays**.

### Example from ProductController

```php
use App\Data\ProductData;

public function store(Request $request): JsonResponse
{
    $this->authorize('create', Product::class);

    // Validate using ProductData DTO
    $productDto = ProductData::validate($request->all());

    // Create via service (returns DTO)
    $createdProduct = $this->productService->create($productDto);

    return response()->json([
        'success' => true,
        'message' => 'Product created successfully',
        'data' => $createdProduct->toArray(), // ← Convert DTO to array
    ], 201);
}

public function show(Product $product): JsonResponse
{
    $this->authorize('view', $product);

    // Service returns DTO
    $productDto = $this->productService->getById($product->id);

    return response()->json([
        'success' => true,
        'data' => $productDto->toArray(),
    ]);
}

public function index(Request $request): JsonResponse
{
    $this->authorize('viewAny', Product::class);

    $products = $this->productService->getAll($filters, $perPage);

    // Convert paginated collection to DTOs
    $productDtos = ProductData::collection($products->items());

    return response()->json([
        'success' => true,
        'data' => $productDtos->toArray(),
        'meta' => [
            'current_page' => $products->currentPage(),
            'total' => $products->total(),
        ],
    ]);
}
```

**Best Practices:**
- Use `ProductData::validate()` instead of FormRequests
- Always call `->toArray()` before returning JSON
- For collections, use `ProductData::collection()`
- Remove API Resources (replaced by DTOs)

---

## Common Patterns

### Pattern 1: Simple DTO (No Relationships)

```php
class CategoryData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Max(255)]
        public string $name,

        public string|Optional|null $description,

        public bool $is_active,
    ) {}
}
```

### Pattern 2: DTO with Lazy Relationship

```php
class CustomerData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Max(255)]
        public string $name,

        // ...
    ) {}

    #[Lazy]
    public function orders(): DataCollection
    {
        if (! $this->resource?->relationLoaded('orders')) {
            return OrderData::collection([]);
        }

        return OrderData::collection($this->resource->orders);
    }
}
```

### Pattern 3: DTO with Computed Property

```php
class OrderData extends Data
{
    public function __construct(
        public int|Optional $id,
        public float $subtotal,
        public float $tax_rate,
        public float $discount,
    ) {}

    #[Computed]
    public function total(): float
    {
        $taxAmount = $this->subtotal * ($this->tax_rate / 100);
        return round($this->subtotal + $taxAmount - $this->discount, 2);
    }
}
```

### Pattern 4: Nested DTOs

```php
class InvoiceData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required]
        public CustomerData $customer, // Nested DTO

        public array $items, // Array of InvoiceItemData
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? Optional::create(),
            customer: CustomerData::from($data['customer']),
            items: InvoiceItemData::collection($data['items'] ?? [])->toArray(),
        );
    }
}
```

### Pattern 5: Helper Methods

```php
class ProductData extends Data
{
    // ... properties ...

    /**
     * Check if product can have components
     */
    public function canHaveComponents(): bool
    {
        return $this->product_type === ProductType::COMPOSITE;
    }

    /**
     * Check if product is inventoriable
     */
    public function isInventoriable(): bool
    {
        return $this->product_type === ProductType::ARTICLE;
    }

    /**
     * Get human-readable product type label
     */
    public function productTypeLabel(): string
    {
        return $this->product_type->label();
    }
}
```

---

## Migration from FormRequests & API Resources

### Before (Old Way)

```php
// FormRequest
class StoreProductRequest extends FormRequest
{
    public function rules(): array {
        return [
            'code' => 'required|max:255|unique:products',
            'name' => 'required|max:255',
        ];
    }
}

// API Resource
class ProductResource extends JsonResource
{
    public function toArray($request): array {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
        ];
    }
}

// Controller
public function store(StoreProductRequest $request) {
    $product = Product::create($request->validated());
    return new ProductResource($product);
}
```

### After (Spatie Data Way)

```php
// ProductData (combines validation + transformation)
class ProductData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Max(255), Unique('products', 'code')]
        public string $code,

        #[Required, Max(255)]
        public string $name,
    ) {}
}

// Controller
public function store(Request $request) {
    $productDto = ProductData::validate($request->all());
    $product = Product::create($productDto->toArray());
    return response()->json(ProductData::from($product)->toArray());
}
```

**Benefits:**
- ✅ **50% less code** (no separate FormRequest and Resource classes)
- ✅ **Single source of truth** for validation and transformation
- ✅ **Type-safe** throughout the entire request/response cycle
- ✅ **IDE autocomplete** for all properties

---

## Testing DTOs

### Example Test

```php
it('creates ProductData from model using WithData trait', function () {
    $product = Product::factory()->create([
        'code' => 'ART-001',
        'name' => 'Test Article',
    ]);

    $productData = ProductData::from($product);

    expect($productData)->toBeInstanceOf(ProductData::class)
        ->and($productData->code)->toBe('ART-001')
        ->and($productData->name)->toBe('Test Article');
});

it('validates required fields using validation attributes', function () {
    expect(fn () => ProductData::validate([
        'name' => 'Test Product',
        // Missing required 'code' field
    ]))->toThrow(ValidationException::class);
});

it('lazy loads components only when requested', function () {
    $product = Product::with('components')->find($id);
    $productData = ProductData::from($product);

    // Components NOT included by default
    expect($productData->toArray())->not->toHaveKey('components');

    // Include components
    $productDataWithComponents = $productData->include('components');
    expect($productDataWithComponents->toArray())->toHaveKey('components');
});
```

---

## Summary Checklist

When creating a new Data class, ensure:

- [ ] Extends `Spatie\LaravelData\Data`
- [ ] Uses constructor property promotion
- [ ] Has comprehensive PHPDoc explaining purpose and features
- [ ] Properties are properly typed (`int`, `string`, `bool`, `Optional`, enums)
- [ ] Validation attributes on all required/validated fields
- [ ] Relationships use `#[Lazy]` attribute
- [ ] Derived values use `#[Computed]` attribute
- [ ] Helper methods for business logic
- [ ] Corresponding model has `WithData` trait
- [ ] Service methods accept/return DTOs
- [ ] Controller uses `::validate()` and `->toArray()`
- [ ] Tests cover validation, lazy loading, and computed properties

---

## References

- [Spatie Laravel Data v4 Documentation](https://spatie.be/docs/laravel-data/v4/introduction)
- [Validation Attributes](https://spatie.be/docs/laravel-data/v4/as-a-data-transfer-object/validation)
- [Lazy Properties](https://spatie.be/docs/laravel-data/v4/as-a-data-transfer-object/lazy-properties)
- [Computed Properties](https://spatie.be/docs/laravel-data/v4/as-a-data-transfer-object/computed-properties)

---

**Last Updated:** January 2025
**Maintainer:** Davide Donghi
**Project:** DGGM ERP
