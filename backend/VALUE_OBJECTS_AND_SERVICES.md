# Value Objects + Services - Architettura Finale ✅

## Refactoring Completato

Value Objects refactorati per essere **leggeri** + Services creati per **logica complessa**.

---

## 🎯 Regola Chiave

**Value Object = Valore di dominio (type-safe + DB)**
**Service = Logica riutilizzabile su Value Objects**

```
Value Object (dati + predicati semplici)
          ↓
      Service (logica complessa)
          ↓
      Action (business operation)
```

---

## ✅ Value Objects Implementati (LEGGERI)

### 1. Coordinates

```php
// app/ValueObjects/Coordinates.php
class Coordinates implements Castable
{
    public function __construct(
        public readonly float $latitude,
        public readonly float $longitude
    ) {
        $this->validate(); // ✅ Solo validazione
    }

    // ✅ Metodi semplici OK
    public function toArray(): array
    public function toString(): string
    public function toGoogleMapsUrl(): string

    // ❌ RIMOSSO: distanceTo() → GeolocationService
    // ❌ RIMOSSO: isWithinRadius() → GeolocationService
    // ❌ RIMOSSO: getDirectionsTo() → GeolocationService
}
```

**Uso:**
```php
// Model
class Site extends Model {
    protected function casts(): array {
        return ['coordinates' => Coordinates::class];
    }
}

// Lettura
$site->coordinates->latitude;      // 45.4642
$site->coordinates->toString();    // "45.4642,9.1900"

// Scrittura
$site->coordinates = new Coordinates(45.4642, 9.1900);
$site->save(); // Salvato come JSON
```

---

### 2. Money

```php
// app/ValueObjects/Money.php
class Money implements Castable
{
    public function __construct(
        public readonly float $amount,
        public readonly string $currency = 'EUR'
    ) {}

    // ✅ Operazioni matematiche BASE OK
    public function add(Money $other): self
    public function subtract(Money $other): self
    public function multiply(float $factor): self
    public function divide(float $divisor): self

    // ✅ Predicati OK
    public function isZero(): bool
    public function isPositive(): bool
    public function isGreaterThan(Money $other): bool

    // ✅ Format OK
    public function format(): string  // "100,00 €"

    // ❌ RIMOSSO: percentage() → PriceCalculatorService
    // ❌ RIMOSSO: addPercentage() → PriceCalculatorService
}
```

**Uso:**
```php
// Model
class Product extends Model {
    protected function casts(): array {
        return [
            'cost' => Money::class,
            'price' => Money::class,
        ];
    }
}

// Operazioni base
$product->price->add(Money::EUR(10));
$product->price->multiply(1.22);      // +22%
$product->price->format();            // "100,00 €"

// Predicati
$product->price->isGreaterThan($product->cost);  // bool
```

---

### 3. Address

```php
// app/ValueObjects/Address.php (già leggero)
class Address implements Castable
{
    public function __construct(
        public readonly ?string $street,
        public readonly ?string $city,
        public readonly ?string $province,
        public readonly ?string $postalCode,
        public readonly string $country = 'IT'
    ) {}

    public function toString(): string
    public function isComplete(): bool
    public function isInProvince(string $province): bool
}
```

---

### 4. DateRange

```php
// app/ValueObjects/DateRange.php (già leggero)
class DateRange implements Castable
{
    public function __construct(
        public readonly Carbon $start,
        public readonly ?Carbon $end = null
    ) {}

    // Metodi semplici OK
    public function includes(Carbon $date): bool
    public function isPast(): bool
    public function isFuture(): bool
    public function getDurationInDays(): int
}
```

---

## 🚀 Services Implementati (LOGICA COMPLESSA)

### 1. GeolocationService

```php
// app/Services/GeolocationService.php
class GeolocationService
{
    /**
     * Calcola distanza tra due coordinate (Haversine)
     */
    public function calculateDistance(Coordinates $point1, Coordinates $point2): float

    /**
     * Verifica se punto è entro raggio
     */
    public function isWithinRadius(Coordinates $point, Coordinates $center, float $radiusKm): bool

    /**
     * Verifica raggio in metri (timbrature)
     */
    public function isWithinRadiusMeters(Coordinates $point, Coordinates $center, float $radiusMeters): bool

    /**
     * Trova punto più vicino
     */
    public function findClosest(Coordinates $from, array $points): ?array

    /**
     * Filtra punti entro raggio
     */
    public function filterWithinRadius(Coordinates $center, array $points, float $radiusKm): array

    /**
     * Calcola centroide
     */
    public function calculateCentroid(array $points): Coordinates

    /**
     * URL direzioni Google Maps
     */
    public function getDirectionsUrl(Coordinates $from, Coordinates $to): string
}
```

**Uso nelle Actions:**
```php
class ClockInAction
{
    public function __construct(
        private readonly GeolocationService $geoService
    ) {}

    public function execute(User $user, int $siteId, Coordinates $userCoords): TimeEntry
    {
        return DB::transaction(function () use ($user, $siteId, $userCoords) {
            $site = Site::findOrFail($siteId);

            // ✅ Service usa Value Objects
            $isValid = $this->geoService->isWithinRadiusMeters(
                $userCoords,           // Coordinates VO
                $site->coordinates,    // Coordinates VO (dal DB)
                100                    // 100 metri
            );

            return TimeEntry::create([
                'user_id' => $user->id,
                'site_id' => $siteId,
                'clock_in' => now(),
                'clock_in_coordinates' => $userCoords,  // Salvato come JSON
                'requires_verification' => !$isValid,
            ]);
        });
    }
}
```

---

### 2. PriceCalculatorService

```php
// app/Services/PriceCalculatorService.php
class PriceCalculatorService
{
    public const VAT_RATE_STANDARD = 22.0;

    /**
     * Calcola prezzo con ricarico
     */
    public function calculateMarkup(Money $cost, float $markupPercent): Money

    /**
     * Applica sconto percentuale
     */
    public function applyDiscount(Money $price, float $discountPercent): Money

    /**
     * Calcola IVA
     */
    public function calculateVAT(Money $price, float $vatRate = 22.0): Money

    /**
     * Aggiungi IVA
     */
    public function addVAT(Money $price, float $vatRate = 22.0): Money

    /**
     * Rimuovi IVA (scorporo)
     */
    public function removeVAT(Money $priceWithVAT, float $vatRate = 22.0): Money

    /**
     * Calcolo completo con tutte le operazioni
     */
    public function calculateFinalPrice(Money $baseCost, array $options = []): Money

    /**
     * Calcola margine percentuale
     */
    public function calculateMarginPercent(Money $cost, Money $sellPrice): float

    /**
     * Calcola markup percentuale
     */
    public function calculateMarkupPercent(Money $cost, Money $sellPrice): float

    /**
     * Calcola prezzo vendita da margine
     */
    public function calculateSellPriceFromMargin(Money $cost, float $marginPercent): Money

    /**
     * Calcola totale
     */
    public function calculateTotal(array $prices): Money

    /**
     * Calcola totale con quantità
     */
    public function calculateTotalWithQuantity(array $items): Money
}
```

**Uso nelle Actions:**
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
                // ✅ Service calcola prezzo usando Money VO
                $finalPrice = $this->priceCalculator->calculateFinalPrice(
                    $item->cost,  // Money VO
                    [
                        'markup' => 50,           // 50% ricarico
                        'discount_percent' => 10, // 10% sconto
                        'add_vat' => true,        // +IVA 22%
                    ]
                );

                $quote->items()->create([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'unit_cost' => $item->cost,           // Money VO
                    'unit_price' => $finalPrice,          // Money VO
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

## 📊 Confronto: Prima vs Dopo

### PRIMA (Value Objects troppo pesanti)

```php
// ❌ Value Object con logica complessa
class Coordinates
{
    public function distanceTo(Coordinates $other): float {
        // Formula Haversine qui... (logica complessa!)
    }

    public function isWithinRadius(Coordinates $center, float $radius): bool {
        // Calcolo + validazione qui...
    }
}

// Uso diretto nel codice
$distance = $site->coordinates->distanceTo($worker->coordinates);
```

**Problemi:**
- Value Object troppo pesante
- Logica duplicata se serve in altri contesti
- Difficile testare in isolamento

---

### DOPO (Value Objects leggeri + Services)

```php
// ✅ Value Object leggero (solo dati + validazione)
class Coordinates implements Castable
{
    public function __construct(
        public readonly float $latitude,
        public readonly float $longitude
    ) {
        $this->validate();
    }

    public function toArray(): array { ... }
    public function toString(): string { ... }
}

// ✅ Service con logica riutilizzabile
class GeolocationService
{
    public function calculateDistance(Coordinates $p1, Coordinates $p2): float
    {
        // Formula Haversine
    }

    public function isWithinRadius(Coordinates $point, Coordinates $center, float $radius): bool
    {
        return $this->calculateDistance($point, $center) <= $radius;
    }
}

// ✅ Uso nelle Actions
class ClockInAction
{
    public function __construct(
        private readonly GeolocationService $geoService
    ) {}

    public function execute(...) {
        $isValid = $this->geoService->isWithinRadiusMeters(
            $userCoords,
            $site->coordinates,
            100
        );
    }
}
```

**Vantaggi:**
- Value Object leggero e focalizzato
- Service testabile in isolamento
- Logica riutilizzabile in Actions, Jobs, Commands
- Dependency Injection facilitata

---

## 🎯 Decision Tree per l'AI

### Ho un concetto di dominio da salvare nel DB?
```
SÌ → Crea Value Object
  ├─ Validazione nel costruttore
  ├─ Metodi semplici (format, predicati)
  ├─ Implementa Castable
  └─ Logica complessa → Service
```

### Ho logica riutilizzabile (calcoli, GPS, etc.)?
```
SÌ → Crea Service
  ├─ Usa Value Objects come parametri
  ├─ Stateless (no proprietà)
  ├─ Iniettato nelle Actions via DI
  └─ Testabile in isolamento
```

---

## 📋 Checklist Implementazione

- [x] Coordinates refactorato (leggero)
- [x] Money refactorato (operazioni base OK)
- [x] Address già leggero (nessuna modifica)
- [x] DateRange già leggero (nessuna modifica)
- [x] GeolocationService creato
- [x] PriceCalculatorService creato
- [x] AI_ARCHITECTURE_RULES aggiornato
- [x] Documentazione completa

---

## 🚀 Prossimi Services da Creare (quando serve)

### WorkingDaysCalculatorService
```php
class WorkingDaysCalculatorService
{
    public function calculateWorkingDays(DateRange $period, array $holidays = []): int
    public function isWorkingDay(Carbon $date, array $holidays = []): bool
    public function getNextWorkingDay(Carbon $date): Carbon
}
```

### DocumentGeneratorService
```php
class DocumentGeneratorService
{
    public function generateQuotePDF(Quote $quote): string
    public function generateInvoicePDF(Invoice $invoice): string
    public function generateSALReport(Site $site): string
}
```

### VATCalculatorService
```php
class VATCalculatorService
{
    public function calculateSplitPayment(Money $amount): array
    public function calculateReverseCharge(Money $amount): array
    public function getVATRate(string $productCategory): float
}
```

---

**Versione**: 1.0
**Data**: 21 Gennaio 2025
**Status**: IMPLEMENTATO - Value Objects + Services pattern definitivo
