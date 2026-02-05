# DGGM ERP - Architecture Rules

**CRITICAL**: Read this file BEFORE writing ANY backend code.
**Version**: 2.0 (Unified Architecture Guide)
**Last Updated**: February 2026

---

## 🎯 Three-Layer Pattern (MANDATORY)

```
HTTP Request → Controller (THIN) → Query/Action → Service (optional) → Response
                    ↓                    ↓              ↓
                 Policy           Database/Events   Calculations
```

**Core Principles:**
1. **Controllers are THIN** - Only HTTP concerns (auth, response)
2. **Query/Action Pattern** - ALL database operations in dedicated classes
3. **Services** - ONLY calculations, formatting (NO database)
4. **Spatie Data** - DTOs for validation + output
5. **Event-Driven** - Side-effects via Events + Listeners

---

## 📁 Directory Structure

```
app/
├── Actions/{Domain}/          # Write operations (Create, Update, Delete)
│   ├── CreateProductAction.php
│   ├── UpdateProductAction.php
│   └── DeleteProductAction.php
│
├── Queries/{Domain}/          # Complex read operations
│   └── GetLowStockProductsQuery.php
│
├── Services/                  # Calculations, formatting (NO DB)
│   ├── PriceCalculatorService.php
│   └── GeolocationService.php
│
├── Data/                      # Spatie Data DTOs (input + output)
│   └── ProductData.php
│
├── Http/Controllers/Api/V1/   # THIN controllers
├── Policies/                  # Authorization
├── Events/                    # Domain events
├── Listeners/                 # Event handlers
└── Models/                    # Eloquent models
```

---

## 1. Controller Pattern (THIN)

**MUST:**
- ✅ Authorize via Policy (`$this->authorize()`)
- ✅ Validate via Spatie Data (`ProductData::from($request)`)
- ✅ Simple reads: Eloquent directly in controller (1-3 WHERE clauses)
- ✅ Complex reads: delegate to Query Class
- ✅ Writes: delegate to Action
- ✅ Return Spatie Data response (`ProductData::from($product)`)

**MUST NOT:**
- ❌ Business logic in controller
- ❌ Complex queries inline
- ❌ Direct database writes

### Example: Simple Read (in Controller)

```php
public function index(Request $request): JsonResponse
{
    $this->authorize('viewAny', Product::class);

    $products = Product::query()
        ->when($request->search, fn($q, $search) =>
            $q->where('name', 'like', "%{$search}%")
        )
        ->when($request->is_active !== null, fn($q) =>
            $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN))
        )
        ->orderBy('name')
        ->paginate(20);

    return response()->json([
        'success' => true,
        'data' => ProductData::collection($products->items()),
        'meta' => [
            'current_page' => $products->currentPage(),
            'total' => $products->total(),
        ],
    ]);
}
```

### Example: Complex Read (Query Class)

```php
// Controller
public function lowStock(): JsonResponse
{
    $this->authorize('viewAny', Product::class);

    $products = app(GetLowStockProductsQuery::class)->execute();

    return response()->json([
        'success' => true,
        'data' => ProductData::collection($products),
    ]);
}

// Query Class: app/Queries/Product/GetLowStockProductsQuery.php
class GetLowStockProductsQuery
{
    public function execute(): Collection
    {
        return Product::whereHas('inventory', function ($query) {
            $query->whereRaw('quantity_available <= minimum_stock');
        })
            ->with(['inventory' => function ($query) {
                $query->whereRaw('quantity_available <= minimum_stock')
                    ->with('product');
            }])
            ->get();
    }
}
```

### Example: Write (Action)

```php
// Controller
public function store(Request $request): JsonResponse
{
    $this->authorize('create', Product::class);

    $product = app(CreateProductAction::class)->execute(
        ProductData::from($request)
    );

    return response()->json([
        'success' => true,
        'data' => ProductData::from($product),
    ], 201);
}

// Action: app/Actions/Product/CreateProductAction.php
class CreateProductAction
{
    public function execute(ProductData $data): Product
    {
        return DB::transaction(function () use ($data) {
            $product = Product::create($data->toArray());

            ProductCreated::dispatch($product, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $product;
        });
    }
}
```

---

## 2. Actions (Write Operations)

**Location**: `app/Actions/{Domain}/`

**MUST:**
- ✅ Accept Spatie Data DTO as parameter
- ✅ Use `DB::transaction()` for atomicity
- ✅ Use Eloquent directly (NO Repository pattern)
- ✅ Dispatch Events AFTER persistence
- ✅ Return Eloquent Model
- ✅ Inject Services if calculations needed

**MUST NOT:**
- ❌ Use Repository pattern (Eloquent IS the repository)
- ❌ Complex read queries (use Query Class)
- ❌ HTTP concerns (authorization, validation)

### Template

```php
<?php

namespace App\Actions\Product;

use App\Data\ProductData;
use App\Events\ProductCreated;
use App\Models\Product;
use App\Services\PriceCalculatorService;
use Illuminate\Support\Facades\DB;

class CreateProductAction
{
    public function __construct(
        private readonly PriceCalculatorService $priceCalculator
    ) {}

    public function execute(ProductData $data): Product
    {
        return DB::transaction(function () use ($data) {
            // Service for calculations (NO database)
            $finalPrice = $this->priceCalculator->calculateMarkup(
                $data->cost,
                $data->markup_percent
            );

            $product = Product::create([
                ...$data->except('id')->toArray(),
                'price' => $finalPrice,
            ]);

            ProductCreated::dispatch($product, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $product;
        });
    }
}
```

---

## 3. Query Classes (Complex Reads)

**Location**: `app/Queries/{Domain}/`

**WHEN to use:**
- ✅ Complex JOINs
- ✅ Subqueries
- ✅ Nested `whereHas`
- ✅ Reusable queries
- ✅ Complex filtering logic

**WHEN NOT to use:**
- ❌ Simple queries (1-3 WHERE) → put in Controller
- ❌ One-time queries → put in Controller

### Template

```php
<?php

namespace App\Queries\Product;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class GetLowStockProductsQuery
{
    public function execute(): Collection
    {
        return Product::whereHas('inventory', function ($query) {
            $query->whereRaw('quantity_available <= minimum_stock');
        })
            ->with(['inventory' => function ($query) {
                $query->whereRaw('quantity_available <= minimum_stock')
                    ->with('product');
            }])
            ->get();
    }
}
```

### With Parameters

```php
class GetProductInventoryQuery
{
    public function __construct(
        private readonly Product $product
    ) {}

    public function execute(array $filters = []): Collection
    {
        $query = $this->product->inventory()->with(['warehouse']);

        if (isset($filters['low_stock']) && filter_var($filters['low_stock'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereRaw('quantity_available <= minimum_stock');
        }

        if (isset($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }

        return $query->get();
    }
}
```

---

## 4. Services (Domain Logic)

**Location**: `app/Services/`

**MUST contain ONLY:**
- ✅ Calculations (prices, margins, percentages)
- ✅ Data transformations
- ✅ External API integrations (GPS, payment gateways)
- ✅ Reusable validation logic
- ✅ Format operations

**MUST NOT contain:**
- ❌ Database operations (use Actions/Queries)
- ❌ CRUD operations
- ❌ HTTP concerns

### Example: PriceCalculatorService

```php
class PriceCalculatorService
{
    public const VAT_RATE_STANDARD = 22.0;

    public function calculateMarkup(Money $cost, float $markupPercent): Money
    {
        $factor = 1 + ($markupPercent / 100);
        return $cost->multiply($factor);
    }

    public function applyDiscount(Money $price, float $discountPercent): Money
    {
        $factor = 1 - ($discountPercent / 100);
        return $price->multiply($factor);
    }

    public function calculateVAT(Money $price, float $vatRate = self::VAT_RATE_STANDARD): Money
    {
        $vatAmount = $price->amount * ($vatRate / 100);
        return new Money($vatAmount, $price->currency);
    }

    public function calculateFinalPrice(Money $baseCost, array $options = []): Money
    {
        $price = $baseCost;

        if (isset($options['markup'])) {
            $price = $this->calculateMarkup($price, $options['markup']);
        }

        if (isset($options['discount_percent'])) {
            $price = $this->applyDiscount($price, $options['discount_percent']);
        }

        if ($options['add_vat'] ?? false) {
            $vat = $this->calculateVAT($price, $options['vat_rate'] ?? self::VAT_RATE_STANDARD);
            $price = $price->add($vat);
        }

        return $price;
    }
}
```

### Example: GeolocationService

```php
class GeolocationService
{
    public function calculateDistance(Coordinates $point1, Coordinates $point2): float
    {
        $earthRadiusKm = 6371;

        $latFrom = deg2rad($point1->latitude);
        $lonFrom = deg2rad($point1->longitude);
        $latTo = deg2rad($point2->latitude);
        $lonTo = deg2rad($point2->longitude);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $a = sin($latDelta / 2) ** 2 +
             cos($latFrom) * cos($latTo) *
             sin($lonDelta / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusKm * $c;
    }

    public function isWithinRadius(Coordinates $point, Coordinates $center, float $radiusKm): bool
    {
        $distance = $this->calculateDistance($point, $center);
        return $distance <= $radiusKm;
    }
}
```

---

## 5. Spatie Data (DTOs)

**Location**: `app/Data/`

**ALWAYS use for:**
- ✅ Input validation (replaces FormRequest)
- ✅ Output transformation (replaces Resource)
- ✅ Type safety
- ✅ Auto-completion

**Use FormRequest ONLY when:**
- Complex authorization logic
- File uploads with specific validation
- Contextual validation Data can't handle

### Template

```php
<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class ProductData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required, Max(255)]
        public string $name,

        #[Required]
        public string $code,

        public ?string $description,
        public ?float $cost,
        public ?float $price,
        public bool $is_active = true,

        // Computed (not saved to DB)
        public readonly ?float $markup_percent = null,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:products,code'],
            'description' => ['nullable', 'string'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
```

### Usage

```php
// Controller - Input validation
public function store(Request $request): JsonResponse
{
    $product = app(CreateProductAction::class)->execute(
        ProductData::from($request)  // ✅ Validates input
    );

    return response()->json([
        'success' => true,
        'data' => ProductData::from($product),  // ✅ Transforms output
    ]);
}

// Action - Type-safe parameter
public function execute(ProductData $data): Product
{
    return DB::transaction(function () use ($data) {
        $product = Product::create(
            $data->except('id', 'markup_percent')->toArray()
        );

        return $product;
    });
}
```

---

## 6. Value Objects (Lightweight)

**Location**: `app/ValueObjects/`

**WHEN to use:**
- ✅ Domain concept to STORE in database
- ✅ Needs type safety
- ✅ Has validation in constructor
- ✅ Only SIMPLE methods (format, predicates, conversions)

**WHEN NOT to use:**
- ❌ Complex business logic → use Service
- ❌ Calculations → use Service

### Example: Money

```php
class Money implements Castable
{
    public function __construct(
        public readonly float $amount,
        public readonly string $currency = 'EUR'
    ) {}

    // ✅ Basic operations OK
    public function add(Money $other): self
    {
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function multiply(float $factor): self
    {
        return new self($this->amount * $factor, $this->currency);
    }

    // ✅ Predicates OK
    public function isZero(): bool
    {
        return $this->amount === 0.0;
    }

    // ✅ Format OK
    public function format(): string
    {
        return number_format($this->amount, 2, ',', '.') . ' €';
    }

    // ❌ NO complex calculations (markup, VAT) → PriceCalculatorService!
}
```

### Example: Coordinates

```php
class Coordinates implements Castable
{
    public function __construct(
        public readonly float $latitude,
        public readonly float $longitude
    ) {
        $this->validate();
    }

    private function validate(): void
    {
        if ($this->latitude < -90 || $this->latitude > 90) {
            throw new InvalidArgumentException('Invalid latitude');
        }
        if ($this->longitude < -180 || $this->longitude > 180) {
            throw new InvalidArgumentException('Invalid longitude');
        }
    }

    public function toString(): string
    {
        return "{$this->latitude},{$this->longitude}";
    }

    // ❌ NO distanceTo() → GeolocationService!
}
```

**Rule**: Value Object (data) + Service (logic)

```php
// ✅ CORRECT
$distance = $geoService->calculateDistance(
    $site->coordinates,    // VO
    $worker->coordinates   // VO
);

// ❌ WRONG
$distance = $site->coordinates->distanceTo($worker->coordinates);
```

---

## 7. Events & Listeners

**MUST:**
- ✅ Dispatch events AFTER persistence in `DB::transaction()`
- ✅ Include metadata (user_id, ip_address)
- ✅ Use for side-effects (audit, cache, notifications)
- ✅ `implements ShouldQueue` for async listeners

### Event Template

```php
<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Product $product,
        public readonly array $metadata = []
    ) {}
}
```

### Listener Template

```php
<?php

namespace App\Listeners;

use App\Events\ProductCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateProductEmbeddings implements ShouldQueue
{
    public int $tries = 3;
    public int $timeout = 30;

    public function handle(ProductCreated $event): void
    {
        \Log::info('Product created', [
            'product_id' => $event->product->id,
            'user_id' => $event->metadata['user_id'] ?? null,
        ]);

        // Generate AI embeddings
        // ...
    }
}
```

---

## 🔍 Decision Trees

### Should I create a Service?

```
Is it a calculation, formatting, or external API (NO database)?
├─→ YES → Create Service in app/Services/
│         Examples: PriceCalculatorService, GeolocationService
└─→ NO → Is it a WRITE operation?
         ├─→ YES → Use Action in app/Actions/{Domain}/
         └─→ NO → Is it a complex READ?
                  ├─→ YES → Query Class in app/Queries/{Domain}/
                  └─→ NO → Eloquent in Controller
```

### Should I use a Query Class?

```
Is this a complex query (JOINs, subqueries, nested whereHas)?
├─→ YES → Create Query Class in app/Queries/{Domain}/
└─→ NO → Use Eloquent directly in Controller
```

---

## ❌ Anti-Patterns

### ❌ Service for CRUD

```php
// WRONG
class ProductService
{
    public function create(array $data) { ... }
    public function update(int $id, array $data) { ... }
}

// CORRECT
class CreateProductAction { ... }
class UpdateProductAction { ... }
```

### ❌ Repository Pattern

```php
// WRONG - Eloquent IS the repository
interface ProductRepository { ... }
class ProductEloquentRepository implements ProductRepository { ... }

// CORRECT - Use Eloquent directly in Actions/Queries
Product::create($data);
```

### ❌ Business Logic in Controller

```php
// WRONG
public function store(Request $request)
{
    $product = Product::create($request->all());

    if ($product->type === 'composite') {
        // complex logic here...
    }
}

// CORRECT
public function store(Request $request)
{
    $this->authorize('create', Product::class);

    $product = app(CreateProductAction::class)->execute(
        ProductData::from($request)
    );

    return ProductData::from($product);
}
```

---

## 📋 Pre-Coding Checklist

Before writing code, verify:

- [ ] Controller is thin (no business logic)?
- [ ] Using Actions for writes (Create, Update, Delete)?
- [ ] Using Query Classes for complex reads?
- [ ] Using Eloquent directly for simple reads (in Controller)?
- [ ] Services ONLY for calculations/formatting (NO database)?
- [ ] Spatie Data for input validation AND output?
- [ ] Actions use `DB::transaction()`?
- [ ] Actions dispatch Events after persistence?
- [ ] Value Objects for data + Services for logic?
- [ ] NO Repository pattern?

---

## 🎯 Quick Reference

| Task | Use | Location | Example |
|------|-----|----------|---------|
| **Simple Read** | Eloquent in Controller | Controller | `Product::where('is_active', true)->get()` |
| **Complex Read** | Query Class | `app/Queries/{Domain}/` | `GetLowStockProductsQuery` |
| **Write** | Action | `app/Actions/{Domain}/` | `CreateProductAction` |
| **Calculation** | Service | `app/Services/` | `PriceCalculatorService` |
| **Validation + Output** | Spatie Data | `app/Data/` | `ProductData` |
| **Domain Concept** | Value Object | `app/ValueObjects/` | `Money`, `Coordinates` |
| **Side Effects** | Event + Listener | `app/Events/` | `ProductCreated` |

---

**Version**: 2.0 (Unified)
**Last Updated**: February 2026
**Status**: MANDATORY - Do NOT deviate without explicit approval