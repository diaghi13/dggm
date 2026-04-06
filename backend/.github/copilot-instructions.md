<laravel-boost-guidelines>
=== .ai/ARCHITECTURE rules ===

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

=== .ai/DGGM_GUIDELINES rules ===

# DGGM ERP - Laravel Backend Guidelines

**CRITICAL**: This file contains MANDATORY architectural patterns for DGGM project.
Laravel Boost may overwrite `CLAUDE.md`, so custom guidelines live here.

---

## Architecture Overview: Three-Layer Pattern (MANDATORY)

```
HTTP Request → Controller (THIN) → Action/Query → Service (if needed) → Response
                    ↓                    ↓              ↓
                 Policy           Database/Events   Formatting
```

### Core Principles

1. **Controllers are THIN** - Only HTTP concerns (auth, validation delegation, response)
2. **Query/Action Pattern** - All database operations go through dedicated classes
3. **Services** - Data formatting, calculations, testable business logic
4. **Laravel Data (Spatie)** - DTOs, validation, and resource transformation
5. **Event-Driven** - Side-effects triggered by events on main features

---

## 1. Mandatory Patterns

### 1.1 Query/Action Pattern (OBBLIGATORIO)

**ALL database operations MUST use dedicated Query or Action classes.**

```php
// ✅ CORRECT - Query for reads
class GetActiveCustomersQuery
{
    public function __construct(
        private array $filters = []
    ) {}

    public function execute(): Collection
    {
        return Customer::query()
            ->when($this->filters['search'] ?? null, fn($q, $search) =>
                $q->where('name', 'like', "%{$search}%")
            )
            ->where('is_active', true)
            ->with(['addresses', 'contacts'])
            ->orderBy('name')
            ->get();
    }
}

// ✅ CORRECT - Action for writes
class CreateCustomerAction
{
    public function execute(CustomerData $data): Customer
    {
        $customer = Customer::create($data->toArray());

        event(new CustomerCreated($customer));

        return $customer;
    }
}

// ❌ WRONG - Direct Eloquent in Controller
public function index()
{
    $customers = Customer::where('is_active', true)->get();
    return CustomerResource::collection($customers);
}

// ❌ WRONG - Direct Eloquent in Service
class CustomerService
{
    public function getActive()
    {
        return Customer::where('is_active', true)->get(); // NO!
    }
}
```

**Location**:
- Queries: `app/Actions/{Domain}/Queries/` (e.g., `app/Actions/Customer/Queries/GetActiveCustomersQuery.php`)
- Actions: `app/Actions/{Domain}/` (e.g., `app/Actions/Customer/CreateCustomerAction.php`)

### 1.2 Service Layer (Data Formatting & Business Logic)

**Services handle ONLY:**
- Data formatting and transformation
- Complex calculations
- Orchestration of multiple Actions/Queries
- Logic that needs independent testing

**Services do NOT:**
- Directly query database (use Queries)
- Directly write to database (use Actions)

```php
// ✅ CORRECT - Service for formatting/calculations
class QuoteCalculationService
{
    public function calculateTotals(QuoteData $quote): QuoteTotalsData
    {
        $subtotal = collect($quote->items)->sum('total');
        $tax = $subtotal * ($quote->tax_rate / 100);
        $discount = $subtotal * ($quote->discount_rate / 100);
        $total = $subtotal + $tax - $discount;

        return QuoteTotalsData::from([
            'subtotal' => $subtotal,
            'tax' => $tax,
            'discount' => $discount,
            'total' => $total,
        ]);
    }
}

// ❌ WRONG - Service doing database operations
class QuoteService
{
    public function getAll()
    {
        return Quote::with('items')->get(); // NO! Use Query
    }
}
```

**Location**: `app/Services/` (e.g., `app/Services/QuoteCalculationService.php`)

### 1.3 Spatie Laravel Data (MANDATORY for DTOs)

**ALWAYS use Spatie Laravel Data for:**
- Input validation (instead of FormRequest when possible)
- Data Transfer Objects (DTOs)
- API response resources (instead of Eloquent Resources when possible)

**Use FormRequest ONLY when:**
- Complex authorization logic needed
- File uploads with specific validation
- Contextual validation that Data can't handle efficiently

```php
// ✅ CORRECT - Laravel Data for DTO and validation
class CustomerData extends Data
{
    public function __construct(
        #[Required, Max(255)]
        public string $name,

        #[Required, Email]
        public string $email,

        #[Nullable, Max(20)]
        public ?string $phone,

        public bool $is_active = true,
    ) {}
}

// In Controller
public function store(CustomerData $data)
{
    $this->authorize('create', Customer::class);

    $customer = app(CreateCustomerAction::class)->execute($data);

    return CustomerData::from($customer);
}

// ❌ WRONG - Using FormRequest when Data is sufficient
class CustomerRequest extends FormRequest
{
    public function rules()
    {
        return [
            'name' => 'required|max:255',
            'email' => 'required|email',
        ];
    }
}
```

**When to use FormRequest over Data:**
```php
// ✅ Use FormRequest for complex authorization
class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $customer = $this->route('customer');

        // Complex: check ownership + permissions
        return $this->user()->can('update', $customer)
            && $customer->company_id === $this->user()->company_id;
    }
}

// ✅ Use FormRequest for file uploads
class ImportProductsRequest extends FormRequest
{
    public function rules()
    {
        return [
            'file' => 'required|file|mimes:xlsx,csv|max:10240',
            'overwrite' => 'boolean',
        ];
    }
}
```

### 1.4 Event-Driven Pattern (Side-Effects)

**Main features MUST trigger Events for side-effects.**

```php
// ✅ CORRECT - Action dispatches event
class CreateProductAction
{
    public function execute(ProductData $data): Product
    {
        $product = Product::create($data->toArray());

        // Event triggers side-effects
        event(new ProductCreated($product));

        return $product;
    }
}

// Event
class ProductCreated
{
    public function __construct(public Product $product) {}
}

// Listeners (in EventServiceProvider)
protected $listen = [
    ProductCreated::class => [
        GenerateProductEmbeddings::class,  // AI embeddings
        UpdateInventoryCache::class,       // Cache refresh
        NotifyWarehouseManager::class,     // Notification
    ],
];

// ❌ WRONG - Side-effects in Action
class CreateProductAction
{
    public function execute(ProductData $data): Product
    {
        $product = Product::create($data->toArray());

        // NO! Side-effects should be in listeners
        $this->embeddingService->generate($product);
        Cache::forget('products');
        Notification::send($managers, new ProductCreatedNotification($product));

        return $product;
    }
}
```

**When to use Events:**
- Main feature actions (Create, Update, Delete on core entities)
- Need for multiple side-effects
- Asynchronous operations (queued listeners)
- Decoupling concerns (inventory, notifications, analytics)

**Location**:
- Events: `app/Events/`
- Listeners: `app/Listeners/`
- Registration: `app/Providers/EventServiceProvider.php`

---

## 2. Code Organization (Revised)

```
app/
├── Actions/                    # Query/Action Pattern (MANDATORY)

│   ├── {Domain}/
│   │   ├── Queries/           # Read operations (GetAll, GetById, etc.)

│   │   ├── Create{Entity}Action.php
│   │   ├── Update{Entity}Action.php
│   │   └── Delete{Entity}Action.php
│   ├── Customer/
│   │   ├── Queries/
│   │   │   ├── GetActiveCustomersQuery.php
│   │   │   └── GetCustomerByIdQuery.php
│   │   ├── CreateCustomerAction.php
│   │   └── UpdateCustomerAction.php
│   └── Product/...
│
├── Data/                       # Spatie Laravel Data (DTOs)

│   ├── CustomerData.php
│   ├── ProductData.php
│   └── QuoteTotalsData.php
│
├── Services/                   # Business logic & formatting (NO DB)

│   ├── QuoteCalculationService.php
│   ├── EmbeddingService.php
│   └── UserService.php
│
├── Models/                     # Eloquent models (relationships only)

│   ├── Customer.php
│   ├── Product.php
│   └── Quote.php
│
├── Http/
│   ├── Controllers/Api/V1/    # THIN controllers (HTTP only)

│   │   ├── CustomerController.php
│   │   └── ProductController.php
│   ├── Requests/              # Use ONLY when Data is insufficient

│   │   └── ImportProductsRequest.php
│   └── Resources/             # Use ONLY when Data is insufficient

│       └── ComplexNestedResource.php
│
├── Policies/                   # Authorization (Gates)

│   ├── CustomerPolicy.php
│   └── ProductPolicy.php
│
├── Events/                     # Domain events

│   ├── CustomerCreated.php
│   └── ProductCreated.php
│
├── Listeners/                  # Event handlers (side-effects)

│   ├── GenerateProductEmbeddings.php
│   └── NotifyWarehouseManager.php
│
└── Jobs/                      # Background tasks (Queue)

    ├── SendInvoiceEmail.php
    └── GeneratePdfReport.php
```

---

## 3. Thin Controller Pattern (MANDATORY)

**Controllers handle ONLY:**
1. Authorization (`$this->authorize()`)
2. Delegate to Action/Query
3. Return Data response

```php
// ✅ PERFECT THIN CONTROLLER
class CustomerController extends Controller
{
    public function index(CustomerData $filters)
    {
        $this->authorize('viewAny', Customer::class);

        $customers = app(GetActiveCustomersQuery::class, ['filters' => $filters->toArray()])
            ->execute();

        return CustomerData::collection($customers);
    }

    public function store(CustomerData $data)
    {
        $this->authorize('create', Customer::class);

        $customer = app(CreateCustomerAction::class)->execute($data);

        return CustomerData::from($customer);
    }

    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);

        return CustomerData::from($customer);
    }

    public function update(CustomerData $data, Customer $customer)
    {
        $this->authorize('update', $customer);

        $customer = app(UpdateCustomerAction::class)->execute($customer, $data);

        return CustomerData::from($customer);
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);

        app(DeleteCustomerAction::class)->execute($customer);

        return response()->noContent();
    }
}

// ❌ WRONG - Fat controller
public function store(Request $request)
{
    // NO! Validation should be in Data
    $validated = $request->validate([...]);

    // NO! DB operation should be in Action
    $customer = Customer::create($validated);

    // NO! Side-effect should be in Event Listener
    Cache::forget('customers');

    // NO! Formatting should be in Service or Data
    return response()->json([
        'data' => [
            'id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
        ]
    ]);
}
```

---

## 4. Authorization Pattern

**Use `$this->authorize()` in controllers, NOT `authorizeResource()`**:

```php
// In Controller
$this->authorize('view', $customer);
$this->authorize('viewAny', Customer::class);
$this->authorize('create', Customer::class);
$this->authorize('update', $customer);
$this->authorize('delete', $customer);

// Policy (all authorization logic here)
class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('customers.view');
    }

    public function create(User $user): bool
    {
        return $user->can('customers.create');
    }

    public function update(User $user, Customer $customer): bool
    {
        return $user->can('customers.update')
            && $customer->company_id === $user->company_id;
    }
}
```

---

## 5. Database Naming Conventions

**English, snake_case**:
- Tables: `customers`, `construction_sites`, `time_entries`
- Columns: `created_at`, `user_id`, `is_active`
- Foreign keys: `{table_singular}_id` (e.g., `customer_id`, `site_id`)

---

## 6. Predefined Roles

- **SuperAdmin**: Full system access
- **Admin**: Complete company management
- **ProjectManager**: Sites, quotes, SAL management
- **Foreman**: Assigned sites, team management
- **Worker**: Time tracking, view assigned sites (read-only)
- **Accountant**: Invoicing, accounting, reporting
- **WarehouseManager**: Warehouse, DDT, supplier orders
- **Customer**: View quotes and SAL (customer portal)

---

## 7. Performance Best Practices

### Eager Loading (MANDATORY in Queries)

```php
// ✅ CORRECT
class GetActiveCustomersQuery
{
    public function execute(): Collection
    {
        return Customer::query()
            ->with(['addresses', 'contacts']) // Prevent N+1
            ->where('is_active', true)
            ->get();
    }
}
```

### Caching Strategy

- **Static lists** (roles, permissions): 1h
- **Registry** (customers, suppliers): 15min
- **Dashboard stats**: 5min

### Queue Jobs

- Email sending
- PDF generation
- Excel exports
- AI embeddings

### Database Indexes

- Columns used in WHERE, JOIN, ORDER BY

---

## 8. Security Best Practices

- All API endpoints require Sanctum authentication (except login/register)
- Policy for every resource
- Validation via Laravel Data or FormRequest
- Rate limiting: 60 req/min per authenticated user
- Log critical actions (create/update/delete sensitive data)

---

## 9. Business Rules: Multi-Site Time Tracking

- Worker can clock in/out on multiple sites per day
- Each entry/exit pair associated with specific site
- GPS mandatory: coordinates within 50-100m from site
- If out of range: flag `requires_verification` + notify manager
- Hours calculation: `hours_worked = exit - entry`
- Overtime: daily total > 8h or weekly > 40h

---

## 10. API Standards (From .clauderc)

### Response Format (Standardized)

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "timestamp": "2026-02-04T10:00:00Z"
  }
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 150,
    "last_page": 10
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": ["error message"]
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | Success | GET request successful |
| `201` | Created | POST successful (resource created) |
| `204` | No Content | DELETE successful |
| `400` | Bad Request | Invalid input |
| `401` | Unauthorized | Not authenticated |
| `403` | Forbidden | Not authorized (authenticated but no permission) |
| `404` | Not Found | Resource not found |
| `422` | Unprocessable Entity | Validation errors |
| `500` | Internal Server Error | Server-side error |

### API Query Parameters (Standard)

| Parameter | Example | Purpose |
|-----------|---------|---------|
| **Pagination** | `?page=1&per_page=15` | Paginate results |
| **Sorting** | `?sort=name&order=asc` | Sort results |
| **Filtering** | `?status=active&customer_id=5` | Filter results |
| **Search** | `?q=search-term` | Full-text search |
| **Include Relations** | `?include=customer,items` | Eager load relationships |
| **Specific Fields** | `?fields=id,name,price` | Return only specific fields |

---

## 11. Recommended Packages

### Backend (Laravel)

**Essential:**
- `spatie/laravel-permission` - Roles & permissions (INSTALLED ✅)
- `spatie/laravel-data` - DTOs with validation (INSTALLED ✅)
- `laravel/sanctum` - API authentication (INSTALLED ✅)
- `laravel/horizon` - Queue monitoring
- `barryvdh/laravel-debugbar` - Debug toolbar (dev)

**Optional:**
- `maatwebsite/excel` - Excel import/export
- `barryvdh/laravel-dompdf` - PDF generation
- `spatie/laravel-activitylog` - Audit trail
- `spatie/laravel-query-builder` - API query building

### Frontend (Next.js)

**Essential:**
- `@tanstack/react-query` - Server state (INSTALLED ✅)
- `react-hook-form` - Form management (INSTALLED ✅)
- `zod` - Schema validation (INSTALLED ✅)
- `@tanstack/react-table` - Tables (INSTALLED ✅)
- `axios` - HTTP client (INSTALLED ✅)

**UI:**
- `tailwindcss` + `shadcn/ui` - UI components (INSTALLED ✅)
- `sonner` - Toast notifications
- `recharts` - Charts
- `react-leaflet` - Maps (for GPS features)

**Utilities:**
- `date-fns` - Date manipulation
- `zustand` - Client state (INSTALLED ✅)
- `nuqs` - URL state management

---

## Quick Reference: When to Use What

| Pattern | Use When | Example |
|---------|----------|---------|
| **Action** | Write operations (Create, Update, Delete) | `CreateCustomerAction` |
| **Query** | Read operations (complex filters, joins) | `GetActiveCustomersQuery` |
| **Service** | Formatting, calculations, orchestration | `QuoteCalculationService` |
| **Data** | DTOs, validation, API responses | `CustomerData` |
| **FormRequest** | Complex auth, file uploads | `ImportProductsRequest` |
| **Resource** | Complex nested responses | `QuoteWithItemsResource` |
| **Event** | Main feature actions trigger side-effects | `ProductCreated` |
| **Listener** | Side-effects (notifications, cache, async) | `GenerateProductEmbeddings` |
| **Job** | Background tasks (queue) | `SendInvoiceEmail` |

---

**Last Updated**: February 2026
**Laravel Version**: 12
**PHP Version**: 8.3+
**Spatie Laravel Data**: v4
**Guidelines Source**: ARCHITECTURE.md + DGGM_GUIDELINES.md + .clauderc

=== .ai/GUIDELINES_INDEX rules ===

# DGGM ERP - Guidelines Index

**Purpose**: Navigation map for all project documentation
**Last Updated**: February 2026

---

## 🚀 QUICK START

### First Time Setup

```
1. Read /CLAUDE.md (project overview)
2. Read backend/PROMPT.md (AI rules)
3. Read backend/TODO.md (current state)
4. Backend: Read backend/ARCHITECTURE.md (patterns)
5. Frontend: Read frontend/NEXTJS_GUIDELINES.md + frontend/CLAUDE.md
```

### Before Every Task

```
Backend:  ARCHITECTURE.md → TODO.md → Start coding
Frontend: NEXTJS_GUIDELINES.md → frontend/CLAUDE.md → TODO.md → Start
```

---

## 📋 CRITICAL FILES (Read First)

| File | Priority | Read When | Purpose |
|------|----------|-----------|---------|
| **PROMPT.md** | 🔴 CRITICAL | Session start | AI operational rules, decision trees |
| **ARCHITECTURE.md** | 🔴 CRITICAL | Before backend coding | Query/Action pattern, Services, DTOs |
| **TODO.md** | 🔴 CRITICAL | Always | Current project state |
| **DGGM_GUIDELINES.md** | 🟠 HIGH | Before backend coding | Project-specific conventions |
| **frontend/NEXTJS_GUIDELINES.md** | 🔴 CRITICAL | Before frontend coding | Next.js 16 breaking changes |
| **frontend/CLAUDE.md** | 🔴 CRITICAL | Before frontend coding | Frontend conventions |

---

## 📁 Complete File Inventory

### Root (`/`)

- **CLAUDE.md** 🟠 HIGH - Project overview, tech stack, modules

### Backend (`/backend/.ai/guidelines/`)

#### Architecture

- **ARCHITECTURE.md** 🔴 CRITICAL - Unified architecture guide (Query/Action/Service)
- **DGGM_GUIDELINES.md** 🟠 HIGH - Project-specific Laravel conventions
- **FINAL_ARCHITECTURE.md** 🟢 DEPRECATED - Content merged into ARCHITECTURE.md
- **AI_ARCHITECTURE_RULES.md** 🟢 DEPRECATED - Content merged into ARCHITECTURE.md

#### Operational

- **PROMPT.md** 🔴 CRITICAL - AI system prompt, decision trees, checklists
- **TODO.md** 🔴 CRITICAL - Implementation status, what's done/missing
- **GUIDELINES_INDEX.md** 🟡 MEDIUM - This file (navigation)

### Frontend (`/frontend/docs/`)

- **NEXTJS_GUIDELINES.md** 🔴 CRITICAL - Next.js 16 breaking changes, patterns
- **CLAUDE.md** 🔴 CRITICAL - Frontend conventions, dark mode, state management

---

## 🎯 Read Flow by Task Type

### Backend Module Creation

```
1. ARCHITECTURE.md      (patterns)
2. DGGM_GUIDELINES.md   (conventions)
3. Similar existing module (Warehouse/Product)
4. Start coding
5. Update TODO.md when done
```

### Frontend Page Creation

```
1. NEXTJS_GUIDELINES.md  (Next.js 16)
2. frontend/CLAUDE.md    (conventions)
3. Similar existing page (Customers/Products)
4. Start coding
5. Update TODO.md when done
```

### Troubleshooting

```
1. Check TODO.md (is it actually implemented?)
2. Read ARCHITECTURE.md (following patterns?)
3. Check NEXTJS_GUIDELINES.md (async params?)
4. Run formatters (pint/lint:fix)
```

---

## 🤖 AI Agent Instructions

### Session Start

```bash
1. Read PROMPT.md
2. Read TODO.md
3. Identify task
```

### Before Backend Coding

```bash
1. Read ARCHITECTURE.md (MANDATORY)
2. Check existing implementation (Warehouse/Product)
3. Follow patterns:
   - Actions in app/Actions/{Domain}/
   - Queries in app/Queries/{Domain}/
   - Services in app/Services/ (NO database)
   - Spatie Data for input + output
```

### Before Frontend Coding

```bash
1. Read NEXTJS_GUIDELINES.md (MANDATORY - async params!)
2. Read frontend/CLAUDE.md (MANDATORY - dark mode!)
3. Server Components by default
4. 'use client' only at leaf
```

### After Coding

```bash

# Backend

./vendor/bin/pint
php artisan typescript:transform

# Frontend

npm run lint:fix

# Both

Update TODO.md
```

---

## ❓ Quick Help

| Question | Answer |
|----------|--------|
| **Architecture rules?** | `ARCHITECTURE.md` |
| **Next.js 16 changes?** | `frontend/NEXTJS_GUIDELINES.md` |
| **Current tasks?** | `TODO.md` |
| **What to do now?** | `PROMPT.md` |
| **Project overview?** | `/CLAUDE.md` |
| **Dark mode rules?** | `frontend/CLAUDE.md` |

---

## 📝 Deprecated Files (Content Merged)

- ~~AI_ARCHITECTURE_RULES.md~~ → Merged into **ARCHITECTURE.md**
- ~~FINAL_ARCHITECTURE.md~~ → Merged into **ARCHITECTURE.md**

**Note**: Old files still exist but use **ARCHITECTURE.md** for unified reference.

---

**Version**: 2.0 (Simplified)
**Last Updated**: February 2026

=== .ai/PROMPT rules ===

# DGGM ERP - AI System Prompt

**Purpose**: Core operational rules for AI agents
**Priority**: 🔴 CRITICAL - Read at session start
**Last Updated**: February 2026

---

## 🎯 PROJECT MISSION

Build **production-ready ERP** for service companies managing complete lifecycle: quotes → projects → invoicing → cost analysis.

**Target**: Construction, electrical, plumbing, automation, events, rental, cooperatives
**Tech**: Laravel 12 + Next.js 16 + API-first
**Deploy**: Single-tenant (one installation per company)

---

## 🚨 CRITICAL OPERATIONAL RULES

### 1. Read Documentation FIRST

```
BEFORE ANY code:
├─→ Backend: Read ARCHITECTURE.md (MANDATORY)
├─→ Frontend: Read frontend/NEXTJS_GUIDELINES.md + frontend/CLAUDE.md (MANDATORY)
├─→ Check: TODO.md for current state
└─→ Verify: Code actually exists (don't trust TODO blindly)
```

### 2. Follow Established Patterns

- **Do NOT** invent new patterns
- **Do NOT** refactor architecture without approval
- **Look** at existing implementations (Warehouse, Product modules)
- **Reuse** existing components/services

### 3. Code Quality (ALWAYS)

```bash

# Backend

./vendor/bin/pint                  # Format code

php artisan typescript:transform   # Generate TS types from Spatie Data

# Frontend

npm run lint:fix                   # Format + fix

```

### 4. Dark Mode (Frontend Non-Negotiable)

```tsx
// ❌ WRONG
<div className="bg-white text-black">

// ✅ CORRECT
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

Every UI element must support dark mode. Zero exceptions.

---

## 📖 DECISION TREES

### Backend: Should I create X?

```
CALCULATION or FORMATTING (NO database)?
├─→ YES → Service (app/Services/)
└─→ NO → WRITE operation (create/update/delete)?
         ├─→ YES → Action (app/Actions/{Domain}/)
         └─→ NO → COMPLEX read (JOINs, subqueries)?
                  ├─→ YES → Query Class (app/Queries/{Domain}/)
                  └─→ NO → Eloquent in Controller
```

### Frontend: Should I use 'use client'?

```
Need state or event handlers?
├─→ NO → Server Component (default)
└─→ YES → Is this layout/page.tsx?
           ├─→ YES → Keep Server Component, isolate client logic
           └─→ NO → 'use client' in this component only
```

---

## ✅ COMPLETION CRITERIA

### Task is "Done" when:

**Backend:**
1. ✅ Controller thin (no business logic)
2. ✅ Action with `DB::transaction()` + Events
3. ✅ Spatie Data for validation + output
4. ✅ Policy authorizes
5. ✅ Code formatted (`pint`)
6. ✅ TS types generated (`typescript:transform`)

**Frontend:**
1. ✅ Server Components by default
2. ✅ 'use client' only where needed
3. ✅ Dark mode on ALL elements
4. ✅ TypeScript strict (no `any`)
5. ✅ TanStack Query for API
6. ✅ React Hook Form + Zod
7. ✅ Code formatted (`lint:fix`)

**Both:**
1. ✅ TODO.md updated
2. ✅ No console errors
3. ✅ Feature tested manually

---

## 🔧 COMMON TASKS

### Create Backend Module

```bash

# 1. Migration

php artisan make:migration create_{table}_table

# 2. Model

php artisan make:model {Model}

# 3. Spatie Data (app/Data/)

# Validation + Output (replaces FormRequest + Resource)

# 4. Action (app/Actions/{Domain}/)

# CreateAction, UpdateAction, DeleteAction

# Pattern: DB::transaction() + Event dispatch

# 5. Query Class (if complex reads)

# app/Queries/{Domain}/Get{X}Query.php

# 6. Service (ONLY if calculations needed, NO database)

# app/Services/

# 7. Controller (thin)

php artisan make:controller Api/V1/{Model}Controller --api

# Inject Actions, authorize(), delegate

# 8. Policy

php artisan make:policy {Model}Policy

# 9. Events (if needed for logs/notifications)

php artisan make:event {Model}Created
php artisan make:listener Log{Model}Activity

# 10. Format + Generate TS

./vendor/bin/pint
php artisan typescript:transform

# 11. Update TODO.md

```

### Create Frontend Page

```tsx
// 1. Create page (Server Component by default)
// app/(dashboard)/{module}/page.tsx

export default async function Page() {
  // Fetch on server if needed
  return <div>...</div>
}

// 2. API client (lib/api/{module}.ts)
export const {module}Api = {
  getAll: async () => apiClient.get('/api/v1/{module}'),
}

// 3. Types (lib/types/index.ts)
export interface {Module} {
  id: number
  // ...
}

// 4. Form component (Client Component)
// components/{module}-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// 5. Dark mode everywhere
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"

// 6. Format
npm run lint:fix

// 7. Update TODO.md
```

---

## 🚫 ANTI-PATTERNS (Absolutely Forbidden)

### Backend

```php
// ❌ Business logic in Controller
public function store(Request $request) {
    $data = $request->all();
    if ($data['type'] === 'special') {
        // NO! Move to Action
    }
}

// ❌ Database in Service
class ProductService {
    public function create(array $data) {
        return Product::create($data);  // NO! Use Action
    }
}

// ❌ Separate FormRequest + Resource (when Spatie Data sufficient)
public function store(StoreProductRequest $request) {
    $product = $this->action->execute($request->validated());
    return new ProductResource($product);  // Duplicate!
}

// ✅ CORRECT: Spatie Data for BOTH
public function store(Request $request) {
    $product = app(CreateProductAction::class)->execute(
        ProductData::from($request)  // Input validation
    );
    return ProductData::from($product);  // Output (same DTO!)
}
```

### Frontend

```tsx
// ❌ 'use client' too high
'use client'
export default function Layout({ children }) {
  return <div>{children}</div>  // Everything client-side!
}

// ✅ Push to leaf
import SearchBox from './search-box'  // Client component

export default function Layout({ children }) {
  return (
    <>
      <Header />       {/* Server */}
      <SearchBox />    {/* Client */}
      {children}
    </>
  )
}

// ❌ No dark mode
<div className="bg-white text-black">

// ✅ Full dark mode
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

---

## 🎓 LEARNING FROM CODE

**Reference Implementations:**

| Module | Status | Learn From |
|--------|--------|------------|
| **Warehouse** | Complete | DDD, Actions, Events, Queries |
| **Product** | Complete | Components, relations, semantic search |
| **Worker** | Complete | Rates, invitations, complex forms |
| **Customers** | Complete | Full CRUD, search, filter |
| **Materials** | Complete | Tabs, inventory, movements |

**Pattern**: Find similar → Copy structure → Adapt → Follow same patterns

---

## 🔍 DEBUGGING CHECKLIST

### Backend Issues

```
□ Controller thin (only HTTP)?
□ Action in app/Actions/{Domain}/?
□ Action uses DB::transaction()?
□ Action dispatches Events?
□ Spatie Data for input + output?
□ NO separate FormRequest/Resource?
□ Policy authorizes?
□ Service ONLY calculations (NO database)?
□ Query Class for complex reads?
□ Routes registered?
□ TS types generated?
□ Code formatted (pint)?
□ Code actually exists (not just TODO)?
```

### Frontend Issues

```
□ Server Component by default?
□ 'use client' only where needed?
□ Dark mode on ALL elements?
□ No TypeScript errors (strict)?
□ TanStack Query for API?
□ React Hook Form + Zod?
□ Code formatted (lint:fix)?
```

---

## 📊 PROJECT STATE AWARENESS

### Before Starting Work

```
1. Read TODO.md (current state)
2. Identify ✅ Done, 🚧 In Progress, ❌ Missing
3. Choose task
4. Read relevant guidelines (ARCHITECTURE.md or frontend guidelines)
5. Start coding following patterns
```

### After Completing Work

```
1. Run formatters
2. Verify dark mode (frontend)
3. Test manually
4. Update TODO.md
5. Commit (conventional message)
```

---

## 💡 TIPS FOR AI AGENTS

### General

1. **Be Conservative** - Follow existing patterns
2. **Be Thorough** - Read docs before coding
3. **Be Consistent** - Match existing style
4. **Be Explicit** - Update TODO.md
5. **Be Complete** - Don't leave half-finished features

### When Uncertain

1. Check similar existing implementation
2. Read ARCHITECTURE.md or NEXTJS_GUIDELINES.md
3. Ask for clarification
4. Default to simpler solution

### Performance

- Parallel tool calls when possible
- Read multiple files in single message
- Background agents for analysis
- Batch similar operations

---

## 📝 COMMIT FORMAT

```
<type>: <description>

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
- `feat: add create site form with GPS validation`
- `fix: resolve dark mode contrast in customer list`
- `docs: update TODO.md with completed warehouse`

---

## ✅ SESSION CHECKLIST

### Start

- [ ] Read PROMPT.md (this file)
- [ ] Read TODO.md
- [ ] Identify task

### Before Backend

- [ ] Read ARCHITECTURE.md
- [ ] Check similar module
- [ ] Verify patterns

### Before Frontend

- [ ] Read NEXTJS_GUIDELINES.md
- [ ] Read frontend/CLAUDE.md
- [ ] Check similar page

### After Coding

- [ ] Run formatters
- [ ] Test dark mode (frontend)
- [ ] No errors
- [ ] Update TODO.md
- [ ] Commit

---

**Version**: 2.0 (Compressed)
**Last Updated**: February 2026
**For**: Claude Code, ralph-loop

=== .ai/STANDARDS rules ===

# DGGM ERP - Standards & Best Practices

**Source**: Extracted from `.clauderc` + Project conventions
**Last Updated**: February 2026

---

## 📐 Naming Conventions

### PHP (PSR-12)

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `CustomerService`, `ProductController` |
| Methods | camelCase | `createCustomer()`, `calculateTotal()` |
| Variables | camelCase | `$totalAmount`, `$userName` |
| Constants | SCREAMING_SNAKE_CASE | `VAT_RATE_STANDARD`, `MAX_UPLOAD_SIZE` |

### Database

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case (plural) | `customers`, `construction_sites`, `time_entries` |
| Columns | snake_case | `created_at`, `user_id`, `is_active` |
| Foreign Keys | `{table_singular}_id` | `customer_id`, `site_id`, `product_id` |
| Pivot Tables | Alphabetical order | `customer_site` (NOT `site_customer`) |

### TypeScript

| Element | Convention | Example |
|---------|------------|---------|
| Interfaces | PascalCase | `User`, `Customer`, `Product` |
| Types | PascalCase | `UserRole`, `ProductType` |
| Components | PascalCase | `CustomerForm`, `DataTable` |
| Hooks | camelCase + `use` prefix | `useAuth`, `useCustomers` |
| Functions | camelCase | `handleSubmit`, `fetchCustomers` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `MAX_FILE_SIZE` |

---

## 🎨 UI/UX Standards (From .clauderc)

### Design System

**Colors:**
```css
Primary:    #1890ff  /* Blue corporate */
Success:    #52c41a  /* Green */
Warning:    #faad14  /* Orange */
Error:      #f5222d  /* Red */
Dark:       #262626  /* Neutral dark */
Light:      #f0f0f0  /* Neutral light */
```

**Typography:**
```
Font Family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

Sizes:
  h1: 32px
  h2: 24px
  h3: 20px
  body: 14px
  small: 12px
```

**Spacing:**
```
Unit: 8px
Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
```

### Component Guidelines

**Buttons:**
- **Primary** - Main actions (Save, Confirm)
- **Secondary** - Secondary actions
- **Danger** - Destructive actions (Delete)
- Always show loading state with spinner
- Disabled state visually clear

**Forms:**
- Labels always visible (NO placeholder as label)
- Inline validation after first submit attempt
- Clear, actionable error messages
- Required fields marked with asterisk (*)
- Help text under input when needed

**Tables:**
- Sticky header on scroll
- Pagination with info ("Showing 1-15 of 150")
- Column sorting (click header)
- Filters above table
- Actions column for row operations
- Empty state when no data

**Notifications:**
- Toast for action feedback (success, error, info)
- Position: top-right
- Auto-dismiss after 3-5 seconds
- Manual close option

### Responsive Breakpoints

```
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

**Behavior:**
- Mobile-first approach
- Collapsible sidebar on mobile
- Horizontal scroll tables on mobile
- Single column forms on mobile

---

## 🔒 Security Standards

### Authentication

- Laravel Sanctum for token-based auth
- Token in header: `Authorization: Bearer {token}`
- Token expiration configurable
- Refresh token mechanism

### Authorization

- Spatie Laravel Permission for roles/permissions
- Gates and Policies for granular checks
- Middleware to protect routes

### Best Practices

- ✅ HTTPS mandatory in production
- ✅ Input validation (client AND server)
- ✅ Rate limiting on API (throttle middleware)
- ✅ CORS configured correctly
- ✅ Input sanitization (prevent XSS)
- ✅ Prepared statements (Eloquent does this)
- ✅ Password hashing with bcrypt (Laravel default)
- ✅ Encrypt sensitive data in DB
- ✅ Log access and critical actions
- ✅ Automated database backups

---

## ⚡ Performance Standards

### Backend

**Database:**
- Eager loading for N+1 problem: `->with(['relation'])`
- Query scoping for common filters
- Database indexing on searched columns
- Pagination for long lists
- Chunk for large datasets

**Caching:**
- Redis for config, static lists
- Cache invalidation on updates
- TTL based on data volatility

**Queue:**
- Queue for heavy tasks (email, PDF, import/export)
- Laravel Horizon for monitoring

**Optimization:**
- `composer dump-autoload -o` for production

### Frontend

**React Optimization:**
- Code splitting with `React.lazy()`
- Memoization: `useMemo`, `useCallback`, `React.memo`
- Virtual scrolling for very long lists
- Debounce on search/autocomplete inputs

**Data Fetching:**
- React Query for automatic server state caching
- Stale-while-revalidate strategy

**Assets:**
- Image optimization (format, size)
- Bundle analysis to reduce size
- Lazy load heavy components

---

## 🧪 Testing Standards

### Backend (Pest/PHPUnit)

**Coverage Target**: 70%+

**Test Types:**
- **Unit tests** - Service classes, utilities
- **Feature tests** - API endpoints
- **Database tests** - Use `RefreshDatabase` trait
- **Factories** - Test data (User, Customer, etc.)

**Command**: `php artisan test`

### Frontend (Vitest)

**Test Types:**
- **Component tests** - UI components
- **Integration tests** - Complete features
- **Hook tests** - Custom hooks
- **API mocks** - Mock Service Worker (MSW)

**Command**: `npm run test`

---

## 📦 Git Standards (From .clauderc)

### Branch Strategy (GitFlow)

| Branch | Purpose |
|--------|---------|
| `main` | Production (always deployable) |
| `develop` | Development integration |
| `feature/*` | New features (`feature/sites-module`) |
| `bugfix/*` | Bug fixes (`bugfix/gps-validation`) |
| `hotfix/*` | Urgent production fixes |

### Commit Convention

**Format**: `type(scope): subject`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `style` - Formatting (no logic change)
- `test` - Add/modify tests
- `docs` - Documentation
- `chore` - Maintenance (build, config)

**Examples:**
```
feat(sites): add cost analysis dashboard
fix(time-tracking): resolve GPS validation issue
refactor(api): improve response format consistency
```

### Pull Requests

- Clear description of problem and solution
- Screenshots for UI changes
- Automated tests must pass
- Code review required before merge
- Merge to `develop`, not directly to `main`

---

## 📚 Documentation Standards

### Code Comments

**Principles:**
- Comment the **WHY**, not the **WHAT**
- DocBlocks for public functions (params, return, throws)
- Avoid obvious comments (`// increment i; i++;`)
- Use `TODO:` for pending tasks with ticket reference

**Example:**
```php
/**
 * Calculate final price with markup, discount, and VAT.
 *
 * @param Money $baseCost Base product cost
 * @param array $options Calculation options (markup, discount, vat)
 * @return Money Final calculated price
 */
public function calculateFinalPrice(Money $baseCost, array $options): Money
{
    // ...
}
```

### API Documentation

**Tool**: OpenAPI/Swagger (L5-Swagger for Laravel)

**Requirements:**
- All endpoints documented
- Request/Response examples
- Authentication requirements
- Possible error responses

---

## 🚀 Deployment Standards

### Environments

| Environment | Purpose |
|-------------|---------|
| `development` | Local machine |
| `staging` | Pre-production testing |
| `production` | Live environment |

### Pre-Deploy Checklist

- [ ] Tests pass
- [ ] Code review completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Production database backup

### Post-Deploy Checklist

- [ ] Smoke test critical features
- [ ] Monitor logs for errors
- [ ] Performance monitoring

### Recommended Tools

- Laravel Forge / Envoyer
- GitHub Actions for CI/CD
- Docker for containerization

---

## 🎯 Quality Standards

### Code Review Checklist

- [ ] Clean and readable code?
- [ ] Descriptive variable/function names?
- [ ] Logic easily understandable?
- [ ] Tests present and passing?
- [ ] Performance considered?
- [ ] Security vulnerabilities checked?
- [ ] Documentation adequate?
- [ ] Consistent with codebase?

### Definition of Done

- [ ] Code written and tested
- [ ] Automated tests pass
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Deployed to staging and verified
- [ ] Product owner/client validated (if needed)

---

## 💡 Project Principles

### Always

- ✅ **Security first**
- ✅ **User experience matters**
- ✅ **Readable code > Clever code**
- ✅ **Test critical logic**
- ✅ **Performance matters**

### Avoid

- ❌ **Over-engineering** (KISS principle)
- ❌ **Premature optimization**
- ❌ **Code duplication** (DRY principle)
- ❌ **Too custom solutions** (use reliable packages)
- ❌ **Direct commits to main/develop**

---

**Remember**: Clean code, clear communication, continuous improvement.

**Sources**: `.clauderc` + ARCHITECTURE.md + DGGM_GUIDELINES.md

=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.3.27
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- laravel/socialite (SOCIALITE) - v5
- laravel/mcp (MCP) - v0
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- tailwindcss (TAILWINDCSS) - v4

## Skills Activation

This project has domain-specific skills available. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

- `pest-testing` — Tests applications using the Pest 4 PHP framework. Activates when writing tests, creating unit or feature tests, adding assertions, testing Livewire components, browser testing, debugging test failures, working with datasets or mocking; or when the user mentions test, spec, TDD, expects, assertion, coverage, or needs to verify functionality works.
- `tailwindcss-development` — Styles applications using Tailwind CSS v4 utilities. Activates when adding styles, restyling components, working with gradients, spacing, layout, flex, grid, responsive design, dark mode, colors, typography, or borders; or when the user mentions CSS, styling, classes, Tailwind, restyle, hero section, cards, buttons, or any visual/UI changes.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan

- Use the `list-artisan-commands` tool when you need to call an Artisan command to double-check the available parameters.

## URLs

- Whenever you share a project URL with the user, you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain/IP, and port.

## Tinker / Debugging

- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool

- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)

- Boost comes with a powerful `search-docs` tool you should use before trying other approaches when working with Laravel or Laravel ecosystem packages. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic-based queries at once. For example: `['rate limiting', 'routing rate limiting', 'routing']`. The most relevant results will be returned first.
- Do not add package names to queries; package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'.
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit".
3. Quoted Phrases (Exact Position) - query="infinite scroll" - words must be adjacent and in that order.
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit".
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms.

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.

## Constructors

- Use PHP 8 constructor property promotion in `__construct()`.
    - <code-snippet>public function __construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters unless the constructor is private.

## Type Declarations

- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Enums

- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.

## Comments

- Prefer PHPDoc blocks over inline comments. Never use comments within the code itself unless the logic is exceptionally complex.

## PHPDoc Blocks

- Add useful array shape type definitions when appropriate.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

## Database

- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries.
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## Controllers & Validation

- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

## Authentication & Authorization

- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Queues

- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

## Configuration

- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== laravel/v12 rules ===

# Laravel 12

- CRITICAL: ALWAYS use `search-docs` tool for version-specific Laravel documentation and updated code examples.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

## Laravel 12 Structure

- In Laravel 12, middleware are no longer registered in `app/Http/Kernel.php`.
- Middleware are configured declaratively in `bootstrap/app.php` using `Application::configure()->withMiddleware()`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- The `app\Console\Kernel.php` file no longer exists; use `bootstrap/app.php` or `routes/console.php` for console configuration.
- Console commands in `app/Console/Commands/` are automatically available and do not require manual registration.

## Database

- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 12 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models

- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.

=== pint/core rules ===

# Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test`, simply run `vendor/bin/pint` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.
- CRITICAL: ALWAYS use `search-docs` tool for version-specific Pest documentation and updated code examples.
- IMPORTANT: Activate `pest-testing` every time you're working with a Pest or testing-related task.

=== tailwindcss/core rules ===

# Tailwind CSS

- Always use existing Tailwind conventions; check project patterns before adding new ones.
- IMPORTANT: Always use `search-docs` tool for version-specific Tailwind CSS documentation and updated code examples. Never rely on training data.
- IMPORTANT: Activate `tailwindcss-development` every time you're working with a Tailwind CSS or styling-related task.
</laravel-boost-guidelines>
