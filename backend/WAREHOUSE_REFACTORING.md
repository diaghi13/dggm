# Warehouse Module Refactoring ✅

Refactoring completato dal pattern DDD alla struttura **Laravel Standard + Actions**.

---

## 🎯 Obiettivo

Tornare a una struttura Laravel standard mantenendo i vantaggi delle Actions per la business logic complessa.

---

## 📁 Nuova Struttura

```
app/
├── Actions/                              # ❌ TODO: Spostare qui (al momento in Domains)
│   └── Warehouse/
│       ├── CreateWarehouseAction.php
│       ├── UpdateWarehouseAction.php
│       └── DeleteWarehouseAction.php
│
├── Services/                             # ✅ FATTO
│   └── WarehouseService.php              # Solo metodi di servizio/lettura
│
├── Models/                               # ✅ FATTO
│   └── Warehouse.php                     # Eloquent model
│
├── Http/
│   ├── Controllers/Api/V1/               # ✅ FATTO
│   │   └── WarehouseController.php       # Usa Actions + Service
│   ├── Requests/
│   │   ├── StoreWarehouseRequest.php
│   │   └── UpdateWarehouseRequest.php
│   └── Resources/
│       └── WarehouseResource.php
│
├── Events/                               # ✅ FATTO (già spostati)
│   ├── WarehouseCreated.php
│   ├── WarehouseUpdated.php
│   ├── WarehouseDeleted.php
│   └── InventoryLowStock.php
│
├── Listeners/                            # ✅ FATTO (già spostati)
│   ├── LogWarehouseActivity.php
│   ├── SendLowStockAlert.php
│   └── UpdateWarehouseCache.php
│
└── Data/                                 # ✅ OPZIONALE
    └── WarehouseData.php                 # Spatie Data DTO
```

---

## 🔥 Cosa è Cambiato

### 1. **Actions** → Usano Eloquent direttamente (no Repository)

**Prima (con Repository):**
```php
class CreateWarehouseAction
{
    public function __construct(
        private readonly WarehouseRepository $repository
    ) {}

    public function execute(WarehouseData $data): Warehouse
    {
        return $this->repository->create($data);
    }
}
```

**Dopo (con Eloquent):**
```php
class CreateWarehouseAction
{
    public function execute(WarehouseData $data): Warehouse
    {
        return DB::transaction(function () use ($data) {
            $warehouse = Warehouse::create($data->except('id', 'full_address', 'total_value')->toArray());

            WarehouseCreated::dispatch($warehouse, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $warehouse;
        });
    }
}
```

**Benefici:**
- ✅ Meno boilerplate
- ✅ Più semplice da capire
- ✅ Eloquent è già un Repository pattern
- ✅ Mantiene transaction safety e eventi

---

### 2. **Service** → Solo metodi di "servizio" (read operations)

**Metodi mantenuti:**
- `getAll(array $filters, int $perPage)` - Listing con filtri e pagination
- `getById(int $id)` - Singolo warehouse
- `getByIdWithRelations(int $id, array $relations)` - Con eager loading
- `getInventory(int $warehouseId, array $filters)` - Inventory con filtri
- `getWarehousesWithLowStock()` - Warehouse con stock basso
- `canDelete(int $id)` - Verifica se eliminabile
- `search(string $query, int $limit)` - Ricerca per code/name
- `getStatistics(int $id)` - Statistiche warehouse

**Metodi rimossi** (ora nelle Actions):
- ❌ `create()` → `CreateWarehouseAction`
- ❌ `update()` → `UpdateWarehouseAction`
- ❌ `delete()` → `DeleteWarehouseAction`

**Esempio Service:**
```php
class WarehouseService
{
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Warehouse::query();

        // Filtri
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('name')->paginate($perPage);
    }

    public function getStatistics(int $id): array
    {
        $warehouse = Warehouse::with(['inventory.product'])->findOrFail($id);

        return [
            'total_products' => $warehouse->inventory->count(),
            'total_value' => $warehouse->inventory->sum(fn($i) => $i->quantity_available * ($i->product->standard_cost ?? 0)),
            'low_stock_count' => $warehouse->inventory->filter(fn($i) => $i->quantity_available <= $i->minimum_stock)->count(),
        ];
    }
}
```

---

### 3. **Controller** → Inietta Actions + Service

**Prima (solo Service):**
```php
class WarehouseController extends Controller
{
    public function __construct(
        private readonly WarehouseService $service
    ) {}

    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        $warehouse = $this->service->create($request->validated());
        return response()->json(['data' => $warehouse], 201);
    }
}
```

**Dopo (Actions + Service):**
```php
class WarehouseController extends Controller
{
    public function __construct(
        private readonly WarehouseService $warehouseService,
        private readonly CreateWarehouseAction $createAction,
        private readonly UpdateWarehouseAction $updateAction,
        private readonly DeleteWarehouseAction $deleteAction,
    ) {}

    // READ operations → Service
    public function index(Request $request): JsonResponse
    {
        $warehouses = $this->warehouseService->getAll($filters, $perPage);
        return response()->json(['data' => WarehouseResource::collection($warehouses->items())]);
    }

    // WRITE operations → Actions
    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        $warehouse = $this->createAction->execute(
            WarehouseData::from($request->validated())
        );

        return response()->json([
            'success' => true,
            'data' => new WarehouseResource($warehouse),
        ], 201);
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): JsonResponse
    {
        $updated = $this->updateAction->execute(
            $warehouse->id,
            WarehouseData::from($request->validated())
        );

        return response()->json([
            'success' => true,
            'data' => new WarehouseResource($updated),
        ]);
    }
}
```

---

## ✅ Benefici della Nuova Struttura

### 1. **Semplicità**
- Meno layer (no Repository)
- Eloquent direttamente nelle Actions
- Struttura Laravel standard riconoscibile

### 2. **Mantenimento Vantaggi Actions**
```php
// Riusabilità massima
$action = app(CreateWarehouseAction::class);

// Controller API
public function store(Request $request) {
    return $action->execute($data);
}

// Artisan Command
php artisan warehouse:import file.csv
foreach ($rows as $row) {
    $action->execute(WarehouseData::from($row));
}

// Job asincrono
ImportWarehousesJob::dispatch($csvData);
// nel job: $action->execute($data)

// Test
it('creates warehouse', function () {
    $action = new CreateWarehouseAction();
    $warehouse = $action->execute($data);
    expect($warehouse)->toBeInstanceOf(Warehouse::class);
});
```

### 3. **Separazione Chiara**
- **Service** = Metodi di "servizio" (getAll, search, statistics, filters)
- **Actions** = Business logic (create, update, delete, transfer, calculate)
- **Controller** = HTTP layer (thin, delega a Service/Actions)
- **Events** = Side-effects (audit, cache, notifications)

### 4. **Testabilità**
```php
// Test Action isolata
it('creates warehouse and dispatches event', function () {
    Event::fake([WarehouseCreated::class]);

    $action = new CreateWarehouseAction();
    $warehouse = $action->execute(WarehouseData::from([...]));

    expect($warehouse)->toBeInstanceOf(Warehouse::class);
    Event::assertDispatched(WarehouseCreated::class);
});

// Test Service
it('filters warehouses by search', function () {
    Warehouse::factory()->count(5)->create();

    $service = new WarehouseService();
    $results = $service->getAll(['search' => 'WH001'], 20);

    expect($results->total())->toBe(1);
});
```

---

## 📊 Pattern Finale

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
│                  POST /api/v1/warehouses                     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                CONTROLLER (HTTP Layer - Thin)                │
│  - authorize()                                               │
│  - validate() (FormRequest)                                  │
│  - $createAction->execute($data)                             │
└────────────────────────────┬────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐  ┌────▼────────┐  ┌──────▼─────────┐
│  SERVICE          │  │  ACTION     │  │  ACTION        │
│  (Read Ops)       │  │ (Write Ops) │  │  (Write Ops)   │
│                   │  │             │  │                │
│ - getAll()        │  │ - execute() │  │  - execute()   │
│ - getById()       │  │   - DB      │  │    - DB        │
│ - search()        │  │   - Events  │  │    - Events    │
│ - getInventory()  │  │             │  │                │
└─────────┬─────────┘  └────┬────────┘  └──────┬─────────┘
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │
               ┌────────────▼────────────┐
               │  ELOQUENT MODEL         │
               │  (Warehouse)            │
               └────────────┬────────────┘
                            │
               ┌────────────▼────────────┐
               │      DATABASE           │
               │      (MySQL)            │
               └─────────────────────────┘
```

---

## 🚀 Prossimi Passi

### 1. Opzionale: Spostare Actions
```bash
# Da:
app/Domains/Warehouse/Actions/*.php

# A:
app/Actions/Warehouse/*.php
```

### 2. Applicare stesso pattern ad altri moduli
- `app/Actions/Product/`
- `app/Actions/Site/`
- `app/Actions/Invoice/`

### 3. Pulizia (opzionale)
Se non vuoi più la struttura DDD:
```bash
# Rimuovi vecchia struttura
rm -rf app/Domains/
```

---

## 📝 Convenzioni da Seguire

### Quando usare Service:
- ✅ Metodi di lettura (getAll, getById, search)
- ✅ Query complesse riutilizzabili (getInventory, getStatistics)
- ✅ Filtri e sorting
- ✅ Operazioni di "servizio" comuni

### Quando usare Actions:
- ✅ Operazioni di scrittura (create, update, delete)
- ✅ Business logic complessa (transfer, calculate, process)
- ✅ Operazioni che richiedono transaction
- ✅ Operazioni che dispatchano eventi
- ✅ Operazioni riutilizzabili in Controller/Job/Command

### Controller deve essere:
- ✅ Thin (solo HTTP concerns)
- ✅ authorize() per policy
- ✅ validate() via FormRequest
- ✅ Delega a Service (read) o Action (write)
- ✅ Ritorna JsonResponse con WarehouseResource

---

## ✅ Checklist Refactoring

- [x] Actions usano Eloquent direttamente (no Repository)
- [x] Service contiene solo metodi di servizio/lettura
- [x] Controller inietta Actions + Service
- [x] Controller usa Actions per write operations
- [x] Controller usa Service per read operations
- [x] Events/Listeners già spostati in app/
- [x] Code formatting con Laravel Pint
- [x] Routes funzionanti e testate
- [ ] TODO: Spostare Actions in app/Actions/ (opzionale)
- [ ] TODO: Applicare stesso pattern ad altri moduli

---

**Refactoring completato:** 21 Gennaio 2025
**Pattern finale:** Laravel Standard + Actions + Events
**Benefici:** Semplicità + Riusabilità + Testabilità
