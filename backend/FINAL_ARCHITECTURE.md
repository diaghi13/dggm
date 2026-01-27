# DGGM ERP - Architettura Finale ✅

## Pattern Architetturale Definitivo

```
Controller (thin)
    ├─ GET semplici → Eloquent direttamente
    ├─ GET complesse → Query Classes
    ├─ POST/PUT/DELETE → Actions
    └─ Actions usano → Services (per logica riutilizzabile)
```

---

## 📁 Struttura Implementata (Warehouse)

```
app/
├── Actions/
│   └── Warehouse/                        ✅ Business logic (create, update, delete)
│       ├── CreateWarehouseAction.php
│       ├── UpdateWarehouseAction.php
│       └── DeleteWarehouseAction.php
│
├── Queries/                              ✅ Query complesse riutilizzabili
│   ├── GetWarehouseInventoryQuery.php
│   └── GetWarehousesWithLowStockQuery.php
│
├── Services/                             ✅ Domain Logic (NO CRUD)
│   ├── PriceCalculatorService.php        (esempio futuro)
│   └── GeolocationService.php            (esempio futuro)
│
├── Data/                                 ✅ Spatie Data DTOs
│   └── WarehouseData.php
│
├── Http/Controllers/Api/V1/              ✅ Thin HTTP layer
│   └── WarehouseController.php
│       ├─ index() → Eloquent diretto
│       ├─ store() → CreateWarehouseAction
│       ├─ update() → UpdateWarehouseAction
│       ├─ destroy() → DeleteWarehouseAction
│       ├─ getInventory() → GetWarehouseInventoryQuery
│       └─ lowStock() → GetWarehousesWithLowStockQuery
│
├── Models/                               ✅ Eloquent
│   └── Warehouse.php
│
├── Events/                               ✅ Domain Events
│   ├── WarehouseCreated.php
│   ├── WarehouseUpdated.php
│   └── WarehouseDeleted.php
│
└── Listeners/                            ✅ Event Listeners
    ├── LogWarehouseActivity.php
    └── UpdateWarehouseCache.php
```

---

## ✅ Cosa è Stato Fatto

1. **Eliminato WarehouseService** (metodi GET)
2. **GET semplici** spostati nel Controller con Eloquent
3. **GET complesse** estratte in Query Classes
4. **Actions** refactorate per usare Eloquent direttamente (no Repository)
5. **DTO** (Spatie Data) per type safety
6. **Events & Listeners** mantenuti
7. **AI_ARCHITECTURE_RULES.md** creato → Linee guida per l'AI

---

## 🎯 Benefici

### 1. Semplicità
- Meno layer (no Service per CRUD, no Repository)
- Eloquent direttamente dove serve
- Query semplici inline nel Controller

### 2. Chiarezza
- **Controller** = HTTP
- **Actions** = Write operations
- **Query Classes** = Read complesse
- **Services** = Domain logic riutilizzabile (calcoli, GPS, etc.)

### 3. Scalabilità
- Actions riutilizzabili (Controller/Jobs/Commands)
- Query Classes riutilizzabili
- Services per logica condivisa
- Eventi per side-effects

---

## 📖 Esempio Completo: GET Warehouse

### GET Semplice (nel Controller)

```php
public function index(Request $request): JsonResponse
{
    $this->authorize('viewAny', Warehouse::class);

    $warehouses = Warehouse::query()
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
        'data' => WarehouseResource::collection($warehouses->items()),
    ]);
}
```

### GET Complessa (Query Class)

```php
// Controller
public function lowStock(): JsonResponse
{
    $this->authorize('viewAny', Warehouse::class);

    $query = new GetWarehousesWithLowStockQuery;
    $warehouses = $query->execute();

    return response()->json([
        'success' => true,
        'data' => WarehouseResource::collection($warehouses),
    ]);
}

// Query Class
class GetWarehousesWithLowStockQuery
{
    public function execute(): Collection
    {
        return Warehouse::whereHas('inventory', function ($query) {
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

---

## 📖 Esempio Completo: POST Warehouse

```php
// Controller
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

// Action
class CreateWarehouseAction
{
    public function execute(WarehouseData $data): Warehouse
    {
        return DB::transaction(function () use ($data) {
            $warehouse = Warehouse::create(
                $data->except('id', 'full_address')->toArray()
            );

            WarehouseCreated::dispatch($warehouse, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $warehouse;
        });
    }
}

// DTO
class WarehouseData extends Data
{
    public function __construct(
        public ?int $id,
        #[Required, Max(50)]
        public string $code,
        #[Required, Max(255)]
        public string $name,
        public bool $is_active = true,
    ) {}
}
```

---

## 📖 Esempio Service (Domain Logic)

```php
// PriceCalculatorService (esempio futuro)
class PriceCalculatorService
{
    public function calculateMarkup(float $cost, float $markupPercent): float
    {
        return $cost * (1 + $markupPercent / 100);
    }

    public function applyDiscount(float $price, float $discountPercent): float
    {
        return $price * (1 - $discountPercent / 100);
    }

    public function calculateFinalPrice(float $cost, array $options): float
    {
        $price = $cost;

        if (isset($options['markup'])) {
            $price = $this->calculateMarkup($price, $options['markup']);
        }

        if (isset($options['discount'])) {
            $price = $this->applyDiscount($price, $options['discount']);
        }

        return round($price, 2);
    }
}

// Uso nell'Action
class CalculateQuoteAction
{
    public function __construct(
        private readonly PriceCalculatorService $priceCalculator
    ) {}

    public function execute(QuoteData $data): Quote
    {
        return DB::transaction(function () use ($data) {
            $quote = Quote::create($data->toArray());

            foreach ($data->items as $item) {
                // Usa Service per calcolare prezzo
                $finalPrice = $this->priceCalculator->calculateFinalPrice(
                    $item->cost,
                    [
                        'markup' => $item->markup_percent,
                        'discount' => $item->discount_percent,
                    ]
                );

                $quote->items()->create([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $finalPrice,
                ]);
            }

            QuoteCreated::dispatch($quote);

            return $quote;
        });
    }
}
```

---

## 🚀 Prossimi Passi

### 1. Applicare stesso pattern ad altri moduli
- Product
- Site
- Quote
- TimeTracking
- Invoice

### 2. Creare Services quando serve
- `PriceCalculatorService` (calcoli prezzi, sconti, IVA)
- `GeolocationService` (GPS, distanze, validazioni)
- `WorkingDaysCalculatorService` (giorni lavorativi)
- `DocumentGeneratorService` (PDF generation)

### 3. Opzionale: Spostare Actions
Da `app/Domains/Warehouse/Actions/` a `app/Actions/Warehouse/`

---

## 📋 Checklist per Nuovi Moduli

Quando implementi un nuovo modulo (es. Product, Site), segui:

1. [ ] Crea Actions in `app/Actions/{Domain}/`
   - CreateAction
   - UpdateAction
   - DeleteAction

2. [ ] Crea DTO in `app/Data/{Entity}Data.php`
   - Con validation attributes
   - Con computed properties se serve

3. [ ] Controller thin:
   - GET semplici → Eloquent diretto
   - GET complesse → Query Class in `app/Queries/`
   - POST/PUT/DELETE → Actions

4. [ ] Se serve logica riutilizzabile:
   - Crea Service in `app/Services/`
   - Inietta Service nelle Actions

5. [ ] Eventi & Listeners:
   - Dispatcha eventi nelle Actions
   - Listener per audit, cache, email

6. [ ] Format con Pint:
   ```bash
   ./vendor/bin/pint --dirty
   ```

---

## 📚 File Importanti

- **AI_ARCHITECTURE_RULES.md** → Linee guida per l'AI (LEGGI SEMPRE)
- **FINAL_ARCHITECTURE.md** → Questo file (overview)
- **WAREHOUSE_REFACTORING.md** → Dettagli refactoring Warehouse

---

## ⚠️ Non Fare Mai

- ❌ Service per CRUD (usare Actions)
- ❌ Repository layer (usare Eloquent)
- ❌ Business logic nel Controller (usare Actions)
- ❌ Query complesse inline nel Controller (usare Query Class)
- ❌ Passare array alle Actions (usare DTO)

---

## ✅ Pattern Definitivo - Riepilogo

```
GET semplice      →  Controller (Eloquent diretto)
GET complessa     →  Query Class
POST/PUT/DELETE   →  Action (con DTO)
Logica riutiliz.  →  Service
Side-effects      →  Events → Listeners
```

**Questo è il pattern DEFINITIVO. Non cambiare più!** 🎯

---

**Versione**: 1.0 FINAL
**Data**: 21 Gennaio 2025
**Status**: IMPLEMENTATO - PRONTO PER ALTRI MODULI
