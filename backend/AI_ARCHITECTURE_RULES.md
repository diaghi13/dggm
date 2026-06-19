# AI Architecture Rules - DGGM ERP

**IMPORTANTE**: Questo file contiene le regole architetturali DEFINITIVE per l'AI che assiste in questo progetto.
**NON DEVIARE** da queste regole senza esplicita richiesta dell'utente.

---

## 🎯 Pattern Architetturale Definitivo

```
Controller (HTTP) → Actions (Write) + Query Classes (Read complesse) + Eloquent (Read semplici)
                 ↓
              Services (Domain Logic riutilizzabile - NO CRUD)
                 ↓
              Events → Listeners
```

---

## 📁 Struttura Directory

```
app/
├── Actions/                    # Business logic per WRITE operations
│   └── {Domain}/
│       ├── Create{Entity}Action.php
│       ├── Update{Entity}Action.php
│       └── Delete{Entity}Action.php
│
├── Queries/                    # Query COMPLESSE riutilizzabili (Read)
│   └── Get{Entity}With{Filter}Query.php
│
├── Services/                   # Domain Services (calcoli, utility, NO CRUD)
│   ├── PriceCalculatorService.php
│   ├── GeolocationService.php
│   └── VATCalculatorService.php
│
├── Http/Controllers/           # HTTP Layer (thin)
│   └── Api/V1/
│       └── {Entity}Controller.php
│
├── Data/                       # Spatie Laravel Data DTOs
│   └── {Entity}Data.php
│
├── Models/                     # Eloquent Models
├── Events/                     # Domain Events
├── Listeners/                  # Event Listeners
├── Http/Requests/              # Form Requests (validation)
└── Http/Resources/             # API Resources (response)
```

---

## 🔴 REGOLE OBBLIGATORIE

### 1. CONTROLLER

**DEVE:**
- ✅ Essere thin (solo HTTP concerns)
- ✅ authorize() con Policy
- ✅ validate() con FormRequest
- ✅ GET semplici: query Eloquent direttamente nel controller
- ✅ GET complesse: usare Query Class
- ✅ POST/PUT/DELETE: delegare ad Actions
- ✅ Ritornare JsonResponse con Resource

**NON DEVE:**
- ❌ Contenere business logic
- ❌ Fare query complesse inline (usare Query Class)
- ❌ Chiamare Service per CRUD (usare Actions)

**Esempio GET semplice (nel Controller):**
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
        'meta' => [
            'current_page' => $warehouses->currentPage(),
            'total' => $warehouses->total(),
        ],
    ]);
}
```

**Esempio GET complessa (Query Class):**
```php
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
```

**Esempio POST (Action):**
```php
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
```

---

### 2. ACTIONS

**DEVE:**
- ✅ Contenere business logic per WRITE operations
- ✅ Usare Eloquent direttamente (NO Repository)
- ✅ Usare DB::transaction() quando serve atomicità
- ✅ Dispatchare Eventi dopo persistenza
- ✅ Accettare DTO come parametro (type-safe)
- ✅ Ritornare Model Eloquent
- ✅ Iniettare Services se serve logica riutilizzabile

**NON DEVE:**
- ❌ Usare Repository (Eloquent è già un Repository)
- ❌ Fare query di lettura complesse (usare Query Class)
- ❌ Contenere logica HTTP (authorization, validation)

**Template Action:**

```php
<?php

namespace App\Actions\Warehouse;

use App\Domains\Warehouse\Data\WarehouseData;use App\Domains\Warehouse\Models\Warehouse;use App\Events\WarehouseCreated;use Illuminate\Support\Facades\DB;

class CreateWarehouseAction
{
    public function __construct(
        // Inietta Services se serve logica riutilizzabile
        // private readonly GeolocationService $geoService,
    ) {}

    public function execute(WarehouseData $data): Warehouse
    {
        return DB::transaction(function () use ($data) {
            // Crea usando Eloquent
            $warehouse = Warehouse::create(
                $data->except('id', 'computed_fields')->toArray()
            );

            // Dispatch evento
            WarehouseCreated::dispatch($warehouse, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $warehouse;
        });
    }
}
```

---

### 3. QUERY CLASSES

**QUANDO USARE:**
- ✅ Query con JOIN complessi
- ✅ Query con subquery
- ✅ Query con whereHas annidati
- ✅ Query riutilizzate in più punti
- ✅ Query con logica di filtri complessa

**QUANDO NON USARE:**
- ❌ Query semplici (1-2 where) → metti nel Controller
- ❌ Query usate una sola volta → metti nel Controller

**Template Query Class:**

```php
<?php

namespace App\Queries;

use App\Domains\Warehouse\Models\Warehouse;use Illuminate\Database\Eloquent\Collection;

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

**Con parametri:**
```php
class GetWarehouseInventoryQuery
{
    public function __construct(
        private readonly Warehouse $warehouse
    ) {}

    public function execute(array $filters = []): Collection
    {
        $query = $this->warehouse->inventory()->with(['product']);

        if (isset($filters['low_stock']) && filter_var($filters['low_stock'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereRaw('quantity_available <= minimum_stock');
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        return $query->get();
    }
}
```

---

### 4. SERVICES (Domain Logic)

**DEVE contenere SOLO:**
- ✅ Calcoli matematici riutilizzabili
- ✅ Trasformazioni dati
- ✅ Validazioni complesse riutilizzabili
- ✅ Integrazioni esterne (GPS, API)
- ✅ Logica di dominio condivisa tra Actions

**NON DEVE contenere:**
- ❌ CRUD operations (usare Actions)
- ❌ Query di lettura (usare Controller o Query Class)
- ❌ Persistenza diretta (usare Actions)

**Esempi CORRETTI di Services (IMPLEMENTATI in DGGM):**

```php
// app/Services/PriceCalculatorService.php (IMPLEMENTATO)
class PriceCalculatorService
{
    public const VAT_RATE_STANDARD = 22.0;

    /**
     * Calcola prezzo con ricarico - USA Value Object Money
     */
    public function calculateMarkup(Money $cost, float $markupPercent): Money
    {
        $factor = 1 + ($markupPercent / 100);
        return $cost->multiply($factor);
    }

    /**
     * Applica sconto percentuale
     */
    public function applyDiscount(Money $price, float $discountPercent): Money
    {
        $factor = 1 - ($discountPercent / 100);
        return $price->multiply($factor);
    }

    /**
     * Calcola IVA
     */
    public function calculateVAT(Money $price, float $vatRate = self::VAT_RATE_STANDARD): Money
    {
        $vatAmount = $price->amount * ($vatRate / 100);
        return new Money($vatAmount, $price->currency);
    }

    /**
     * Rimuovi IVA (scorporo)
     */
    public function removeVAT(Money $priceWithVAT, float $vatRate = self::VAT_RATE_STANDARD): Money
    {
        $divisor = 1 + ($vatRate / 100);
        return $priceWithVAT->divide($divisor);
    }

    /**
     * Calcolo complesso con tutte le operazioni
     */
    public function calculateFinalPrice(Money $baseCost, array $options = []): Money
    {
        $price = $baseCost;

        // Ricarico
        if (isset($options['markup'])) {
            $price = $this->calculateMarkup($price, $options['markup']);
        }

        // Sconto
        if (isset($options['discount_percent'])) {
            $price = $this->applyDiscount($price, $options['discount_percent']);
        }

        // IVA
        if ($options['add_vat'] ?? false) {
            $price = $this->addVAT($price, $options['vat_rate'] ?? self::VAT_RATE_STANDARD);
        }

        return $price;
    }

    /**
     * Calcola margine percentuale
     */
    public function calculateMarginPercent(Money $cost, Money $sellPrice): float
    {
        if ($sellPrice->isZero()) return 0.0;
        $profit = $sellPrice->subtract($cost);
        return ($profit->amount / $sellPrice->amount) * 100;
    }
}
```

```php
// app/Services/GeolocationService.php (IMPLEMENTATO)
class GeolocationService
{
    /**
     * Calcola distanza tra due coordinate - USA Value Object Coordinates
     */
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

    /**
     * Verifica se punto è entro raggio
     */
    public function isWithinRadius(Coordinates $point, Coordinates $center, float $radiusKm): bool
    {
        $distance = $this->calculateDistance($point, $center);
        return $distance <= $radiusKm;
    }

    /**
     * Verifica raggio in metri (per timbrature)
     */
    public function isWithinRadiusMeters(Coordinates $point, Coordinates $center, float $radiusMeters): bool
    {
        return $this->isWithinRadius($point, $center, $radiusMeters / 1000);
    }

    /**
     * Trova punto più vicino
     */
    public function findClosest(Coordinates $from, array $points): ?array
    {
        if (empty($points)) return null;

        $closest = null;
        $minDistance = PHP_FLOAT_MAX;

        foreach ($points as $point) {
            $distance = $this->calculateDistance($from, $point);
            if ($distance < $minDistance) {
                $minDistance = $distance;
                $closest = $point;
            }
        }

        return ['coordinates' => $closest, 'distance' => $minDistance];
    }

    /**
     * Genera URL direzioni Google Maps
     */
    public function getDirectionsUrl(Coordinates $from, Coordinates $to): string
    {
        return sprintf(
            'https://www.google.com/maps/dir/?api=1&origin=%s,%s&destination=%s,%s',
            $from->latitude, $from->longitude,
            $to->latitude, $to->longitude
        );
    }
}
```

**Uso dei Services nelle Actions (ESEMPIO REALE):**
```php
class ClockInAction
{
    public function __construct(
        private readonly GeolocationService $geoService
    ) {}

    public function execute(User $user, int $siteId, Coordinates $userCoordinates): TimeEntry
    {
        return DB::transaction(function () use ($user, $siteId, $userCoordinates) {
            $site = Site::findOrFail($siteId);

            // Service usa Value Objects come parametri
            $isValid = $this->geoService->isWithinRadiusMeters(
                $userCoordinates,        // ✅ Coordinates VO
                $site->coordinates,      // ✅ Coordinates VO (dal DB via casting)
                100                      // 100 metri
            );

            $timeEntry = TimeEntry::create([
                'user_id' => $user->id,
                'site_id' => $siteId,
                'clock_in' => now(),
                'clock_in_coordinates' => $userCoordinates,  // ✅ Salvato come JSON
                'requires_verification' => !$isValid,
            ]);

            if (!$isValid) {
                TimeEntryFlaggedForVerification::dispatch($timeEntry);
            }

            return $timeEntry;
        });
    }
}
```

**Uso Service in Action per Calcoli Prezzi:**
```php
class CalculateQuotePriceAction
{
    public function __construct(
        private readonly PriceCalculatorService $priceCalculator
    ) {}

    public function execute(QuoteData $data): Quote
    {
        return DB::transaction(function () use ($data) {
            $quote = Quote::create($data->toArray());

            foreach ($data->items as $item) {
                // Service calcola prezzo usando Money VO
                $finalPrice = $this->priceCalculator->calculateFinalPrice(
                    $item->cost,  // ✅ Money VO
                    [
                        'markup' => 50,           // 50% markup
                        'discount_percent' => 10, // 10% sconto
                        'add_vat' => true,        // +IVA 22%
                    ]
                );

                $quote->items()->create([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'unit_cost' => $item->cost,      // ✅ Money VO
                    'unit_price' => $finalPrice,     // ✅ Money VO
                    'line_total' => $finalPrice->multiply($item->quantity),
                ]);
            }

            QuoteCreated::dispatch($quote);

            return $quote;
        });
    }
}
```

---

### 5. DTOs (Spatie Laravel Data)

**SEMPRE usare DTO per:**
- ✅ Passare dati alle Actions
- ✅ Type safety e auto-completion
- ✅ Validation centralizzata
- ✅ Trasformazioni dati

**Template DTO:**
```php
<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class WarehouseData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required, Max(50)]
        public string $code,

        #[Required, Max(255)]
        public string $name,

        #[Required]
        public string $type,

        public ?string $address,
        public ?string $city,
        public ?string $province,
        public ?string $postal_code,
        public ?int $manager_id,
        public bool $is_active = true,

        // Computed properties (non salvati nel DB)
        public readonly ?string $full_address = null,
    ) {}

    public static function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:main,secondary,temporary'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:2'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'manager_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
```

**Uso nel Controller:**
```php
public function store(StoreWarehouseRequest $request): JsonResponse
{
    // DTO auto-validato e type-safe
    $warehouse = $this->createAction->execute(
        WarehouseData::from($request->validated())
    );

    return response()->json([
        'success' => true,
        'data' => new WarehouseResource($warehouse),
    ], 201);
}
```

**Uso nell'Action:**
```php
public function execute(WarehouseData $data): Warehouse
{
    return DB::transaction(function () use ($data) {
        // Escludi computed properties prima del save
        $warehouse = Warehouse::create(
            $data->except('id', 'full_address')->toArray()
        );

        WarehouseCreated::dispatch($warehouse);

        return $warehouse;
    });
}
```

---

### 6. VALUE OBJECTS (Leggeri + Type Safety)

**QUANDO USARE Value Objects:**
- ✅ Rappresenta un CONCETTO di dominio (Money, Address, Coordinates, DateRange)
- ✅ Va salvato nel DB (Eloquent casting a JSON)
- ✅ Serve type-safety e auto-completion
- ✅ Ha validazione nel costruttore
- ✅ Ha solo metodi SEMPLICI (format, predicati, conversioni)

**QUANDO NON USARE Value Objects:**
- ❌ Per logica complessa → usa Service
- ❌ Per calcoli business → usa Service
- ❌ Per operazioni stateless → usa Service

**Value Objects IMPLEMENTATI in DGGM:**

```php
// app/ValueObjects/Coordinates.php (LEGGERO)
class Coordinates implements Castable
{
    public function __construct(
        public readonly float $latitude,
        public readonly float $longitude
    ) {
        $this->validate(); // ✅ Solo validazione
    }

    public function toArray(): array { ... }           // ✅ Semplice
    public function toString(): string { ... }         // ✅ Semplice
    public function toGoogleMapsUrl(): string { ... }  // ✅ Semplice

    // ❌ NO metodi complessi come distanceTo() → GeolocationService!
}

// app/ValueObjects/Money.php (LEGGERO + operazioni base)
class Money implements Castable
{
    public function __construct(
        public readonly float $amount,
        public readonly string $currency = 'EUR'
    ) {}

    // ✅ Operazioni base OK (parte del concetto Money)
    public function add(Money $other): self { ... }
    public function subtract(Money $other): self { ... }
    public function multiply(float $factor): self { ... }
    public function divide(float $divisor): self { ... }

    // ✅ Predicati OK
    public function isZero(): bool { ... }
    public function isPositive(): bool { ... }
    public function isGreaterThan(Money $other): bool { ... }

    // ✅ Format OK
    public function format(): string { ... }  // "100,00 €"

    // ❌ NO calcoli business complessi (markup, sconti) → PriceCalculatorService!
}

// app/ValueObjects/Address.php (LEGGERO)
class Address implements Castable
{
    public function __construct(
        public readonly ?string $street,
        public readonly ?string $city,
        public readonly ?string $province,
        public readonly ?string $postalCode,
        public readonly string $country = 'IT'
    ) {}

    public function toString(): string { ... }     // ✅ Semplice
    public function isComplete(): bool { ... }     // ✅ Predicato
    public function toArray(): array { ... }       // ✅ Semplice
}
```

**Uso Value Objects nei Models:**
```php
class Site extends Model
{
    protected function casts(): array
    {
        return [
            'coordinates' => Coordinates::class,      // ✅ Salvato come JSON
            'address' => Address::class,              // ✅ Salvato come JSON
            'budget' => Money::class,                 // ✅ Salvato come JSON
        ];
    }
}

// Accesso type-safe
$site->coordinates->latitude;        // float
$site->coordinates->toString();      // "45.4642,9.1900"
$site->budget->format();             // "50.000,00 €"
$site->address->isComplete();        // bool
```

**Regola Chiave: Value Object (dati) + Service (logica)**

```php
// ✅ CORRETTO
$distance = $geoService->calculateDistance(
    $site->coordinates,    // VO
    $worker->coordinates   // VO
);

// ✅ CORRETTO
$finalPrice = $priceCalculator->calculateFinalPrice(
    $product->cost,  // Money VO
    ['markup' => 50, 'discount' => 10]
);

// ❌ SBAGLIATO - logica complessa nel VO
$distance = $site->coordinates->distanceTo($worker->coordinates);
```

---

### 7. EVENTS & LISTENERS

**DEVE:**
- ✅ Dispatchare eventi DOPO persistenza (nel DB::transaction)
- ✅ Eventi con metadata (user_id, ip_address)
- ✅ Listener per side-effects (audit, cache, email)
- ✅ implements ShouldQueue per listener async

**Template Event:**

```php
<?php

namespace App\Events;

use App\Domains\Warehouse\Models\Warehouse;use Illuminate\Broadcasting\InteractsWithSockets;use Illuminate\Foundation\Events\Dispatchable;use Illuminate\Queue\SerializesModels;

class WarehouseCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Warehouse $warehouse,
        public readonly array $metadata = []
    ) {}
}
```

**Template Listener:**
```php
<?php

namespace App\Listeners;

use App\Events\WarehouseCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendLowStockAlert implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(WarehouseCreated $event): void
    {
        \Log::info('Warehouse created', [
            'warehouse_id' => $event->warehouse->id,
            'user_id' => $event->metadata['user_id'] ?? null,
        ]);
    }
}
```

---

## 🔍 Decision Tree per l'AI

### Devo fare una READ operation:

```
È una query semplice (1-3 where, nessun join complesso)?
├─ SÌ → Metti direttamente nel Controller
└─ NO → Crea Query Class in app/Queries/
```

### Devo fare una WRITE operation:

```
SEMPRE → Crea Action in app/Actions/{Domain}/
```

### Ho logica riutilizzabile (calcoli, validazioni, GPS)?

```
SEMPRE → Crea Service in app/Services/
```

### Devo passare dati ad un'Action?

```
SEMPRE → Usa DTO (Spatie Data) in app/Data/
```

---

## ❌ ANTI-PATTERN da Evitare

### ❌ Service per CRUD
```php
// SBAGLIATO
class WarehouseService
{
    public function create(array $data) { ... }
    public function update(int $id, array $data) { ... }
    public function delete(int $id) { ... }
}
```

### ❌ Repository Layer
```php
// SBAGLIATO - Eloquent è già un Repository
interface WarehouseRepository { ... }
class WarehouseEloquentRepository implements WarehouseRepository { ... }
```

### ❌ Business Logic nel Controller
```php
// SBAGLIATO
public function store(Request $request)
{
    $warehouse = Warehouse::create($request->all());

    if ($warehouse->type === 'main') {
        // logica complessa qui...
    }

    WarehouseCreated::dispatch($warehouse);
}
```

### ❌ Query complessa nel Controller inline
```php
// SBAGLIATO
public function lowStock()
{
    $warehouses = Warehouse::whereHas('inventory', function ($q) {
        $q->whereRaw('quantity_available <= minimum_stock')
          ->with(['product' => function ($q) {
              $q->where('is_active', true);
          }]);
    })->with(['manager', 'inventory.product'])->get();
}

// CORRETTO - Usa Query Class
public function lowStock()
{
    $query = new GetWarehousesWithLowStockQuery;
    $warehouses = $query->execute();
}
```

---

## 📋 Checklist per l'AI

Prima di scrivere codice, verifica:

- [ ] Sto mettendo business logic nel Controller? → ❌ NO, spostala in Action
- [ ] Sto creando un Service per CRUD? → ❌ NO, usa Actions
- [ ] Sto creando un Repository? → ❌ NO, usa Eloquent direttamente
- [ ] Questa query è semplice? → ✅ SÌ, metti nel Controller
- [ ] Questa query è complessa? → ✅ SÌ, crea Query Class
- [ ] Sto passando array alle Actions? → ❌ NO, usa DTO
- [ ] Ho logica riutilizzabile (calcoli, GPS)? → ✅ SÌ, crea Service
- [ ] L'Action dispatcha eventi? → ✅ SÌ, sempre dopo persistenza

---

## 🎯 Priorità delle Regole

1. **Controller thin** - Solo HTTP concerns
2. **Actions per write** - SEMPRE, no eccezioni
3. **DTO per Actions** - Type safety obbligatoria
4. **Service = Domain Logic** - NO CRUD, solo utility
5. **Query Class se complessa** - Riutilizzabilità
6. **Eloquent diretto** - NO Repository
7. **Eventi dopo persistenza** - Side-effects decoupled

---

## 📝 Note Finali per l'AI

- **Leggi SEMPRE questo file** prima di scrivere codice per un nuovo modulo
- **NON deviare** da queste regole senza esplicita richiesta
- **Usa i template** forniti per mantenere consistenza
- **Chiedi conferma** se c'è ambiguità, ma segui queste regole come default
- **Non inventare** nuovi pattern senza approvazione

---

**Versione**: 1.0
**Data**: 21 Gennaio 2025
**Status**: DEFINITIVO - NON MODIFICARE senza consenso esplicito
