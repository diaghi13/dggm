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
