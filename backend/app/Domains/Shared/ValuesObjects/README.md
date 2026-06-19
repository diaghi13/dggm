# Value Objects - DGGM ERP

I **Value Objects** sono oggetti immutabili che rappresentano concetti del dominio business.

## =Ž Cosa Sono i Value Objects?

Un Value Object è un oggetto che:
1. **È immutabile** - Una volta creato non può cambiare
2. **Rappresenta un valore** - Non ha identità (due VO con stesso valore sono identici)
3. **Contiene logica di business** - Operazioni relative al concetto che rappresenta
4. **È auto-validante** - Si valida nel costruttore

## =æ Value Objects Disponibili

### 1. **Address** - Indirizzo Completo
```php
use App\ValueObjects\Address;

$address = new Address(
    street: 'Via Roma 123',
    city: 'Milano',
    province: 'MI',
    postalCode: '20121',
    country: 'IT'
);

// Operazioni
$address->toString();              // "Via Roma 123, 20121, Milano, (MI)"
$address->isComplete();            // true
$address->isInProvince('MI');      // true
$address->toGoogleMapsUrl();       // URL Google Maps
$address->toShortString();         // "Milano (MI)"
```

**Quando usarlo:**
- Warehouse, Site, Customer, Supplier locations

---

### 2. **Money** - Importi con Valuta
```php
use App\ValueObjects\Money;

$price = Money::EUR(100);

// Operazioni matematiche
$price->add(Money::EUR(10));           // 110 EUR
$price->subtract(Money::EUR(20));      // 80 EUR
$price->multiply(1.22);                // 122 EUR (con IVA)
$price->percentage(20);                // 20 EUR (20% di 100)
$price->addPercentage(22);             // 122 EUR

// Predicati
$price->isPositive();                  // true
$price->isGreaterThan(Money::EUR(50)); // true
$price->equals(Money::EUR(100));       // true

// Formattazione
$price->format();                      // "100,00 ¬"
$price->format(false);                 // "100,00"
```

**Quando usarlo:**
- Tutti i campi prezzo/importo nei models (Product, Quote, Invoice, etc.)

**IMPORTANTE:** Nel database serve colonna aggiuntiva per la valuta:
```php
Schema::table('products', function (Blueprint $table) {
    $table->decimal('price', 10, 2);
    $table->string('price_currency', 3)->default('EUR');
});
```

---

### 3. **Coordinates** - Geolocalizzazione GPS
```php
use App\ValueObjects\Coordinates;

$site = new Coordinates(45.4642, 9.1900); // Milano
$worker = new Coordinates(45.4640, 9.1895);

// Calcolo distanze
$site->distanceTo($worker);                       // 0.052 km
$site->isWithinRadius($worker, 0.1);              // true (entro 100m)
$site->isWithinRadiusMeters($worker, 100);        // true

// URLs
$site->toGoogleMapsUrl();                         // Apri in Google Maps
$site->getDirectionsTo($worker);                  // Direzioni da A a B

// Validazione
$site->isValid();                                 // true
$site->equals($worker);                           // false
```

**Quando usarlo:**
- Sites (posizione cantiere)
- Time tracking GPS validation
- Warehouse locations

**Nel database:**
```php
Schema::table('sites', function (Blueprint $table) {
    $table->decimal('location_latitude', 10, 8)->nullable();
    $table->decimal('location_longitude', 11, 8)->nullable();
});
```

---

### 4. **DateRange** - Intervallo di Date
```php
use App\ValueObjects\DateRange;
use Carbon\Carbon;

$workPeriod = new DateRange(
    start: Carbon::parse('2025-01-01'),
    end: Carbon::parse('2025-12-31')
);

// Factory methods
DateRange::fromToday(30);          // Prossimi 30 giorni
DateRange::thisMonth();            // Mese corrente
DateRange::thisYear();             // Anno corrente

// Durata
$workPeriod->getDurationInDays();  // 365
$workPeriod->getDurationInWeeks(); // 52.1
$workPeriod->getDurationInMonths();// 12

// Predicati
$workPeriod->includes(Carbon::now());      // true se oggi è nel periodo
$workPeriod->includesNow();                // alias
$workPeriod->isPast();                     // false
$workPeriod->isFuture();                   // false
$workPeriod->isActive();                   // true

// Overlapping
$otherPeriod = DateRange::fromToday(60);
$workPeriod->overlaps($otherPeriod);       // true

// Giorni lavorativi
$workPeriod->getWorkingDays();             // ~260 (esclusi weekend)

// Formattazione
$workPeriod->format();                     // "01/01/2025 - 31/12/2025"
```

**Quando usarlo:**
- Sites (work_period)
- Quotes (validity_period)
- Contracts (contract_period)

**Nel database:**
```php
Schema::table('sites', function (Blueprint $table) {
    $table->date('work_period_start');
    $table->date('work_period_end')->nullable();
});
```

---

### 5. **Percentage** - Gestione Percentuali
```php
use App\ValueObjects\Percentage;

$discount = new Percentage(20); // 20%

// Factory methods
Percentage::vat();             // 22% (IVA italiana)
Percentage::reducedVat();      // 10%
Percentage::zero();            // 0%
Percentage::full();            // 100%
Percentage::fromDecimal(0.22); // 22% da 0.22

// Applicazione a Money
$price = Money::EUR(100);
$discount->applyTo($price);              // Money(80, EUR) - sottrae 20%
$discount->applyTo($price, false);       // Money(120, EUR) - aggiunge 20%

$discount->of($price);                   // Money(20, EUR) - solo la percentuale

// Applicazione a numeri
$discount->ofNumber(100);                // 20.0
$discount->asDecimal();                  // 0.20

// Operazioni
$discount->add(new Percentage(10));      // 30%
$discount->multiply(0.5);                // 10%
$discount->invert();                     // 80% (100 - 20)

// Predicati
$discount->isZero();                     // false
$discount->isFull();                     // false
$discount->isGreaterThan(Percentage::fromDecimal(0.1)); // true

// Formattazione
$discount->format();                     // "20,00%"
```

**Quando usarlo:**
- Sconti (discount_percentage)
- IVA (vat_rate)
- Ricarichi (markup)
- Avanzamento (completion_percentage)

---

## =' Come Usarli nei Models

### Cast Automatico con Eloquent

```php
use App\ValueObjects\Address;
use App\ValueObjects\Money;
use App\ValueObjects\Coordinates;
use App\ValueObjects\DateRange;
use App\ValueObjects\Percentage;

class Product extends Model
{
    protected function casts(): array
    {
        return [
            // Money - serve colonna aggiuntiva per valuta
            'price' => Money::class,

            // Percentage - salva come float
            'discount' => Percentage::class,
            'vat_rate' => Percentage::class,
        ];
    }
}

class Site extends Model
{
    protected function casts(): array
    {
        return [
            // Address - usa colonne esistenti (address, city, province, postal_code)
            'address' => Address::class,

            // Coordinates - serve colonne separate per lat/lng
            'location' => Coordinates::class,

            // DateRange - usa colonne esistenti con suffisso _start/_end
            'work_period' => DateRange::class,
        ];
    }
}
```

### Migrazione Database

```php
// Per Money
Schema::table('products', function (Blueprint $table) {
    $table->decimal('price', 10, 2);
    $table->string('price_currency', 3)->default('EUR');
});

// Per Coordinates
Schema::table('sites', function (Blueprint $table) {
    $table->decimal('location_latitude', 10, 8)->nullable();
    $table->decimal('location_longitude', 11, 8)->nullable();
});

// Per DateRange
Schema::table('sites', function (Blueprint $table) {
    $table->date('work_period_start');
    $table->date('work_period_end')->nullable();
});

// Per Percentage (usa colonna esistente)
Schema::table('products', function (Blueprint $table) {
    $table->decimal('discount', 5, 2)->default(0); // 0-100
});

// Per Address (usa colonne esistenti)
// Nessuna modifica necessaria se hai già address, city, province, postal_code
```

---

## =Ý Esempi Pratici DGGM

### Product con Money e Percentage
```php
$product = Product::create([
    'code' => 'PROD-001',
    'name' => 'Cemento',
    'price' => Money::EUR(50),
    'discount' => new Percentage(10),
    'vat_rate' => Percentage::vat(), // 22%
]);

// Calcolo prezzo finale
$priceAfterDiscount = $product->discount->applyTo($product->price);
$finalPrice = $product->vat_rate->applyTo($priceAfterDiscount, false);

echo $finalPrice->format(); // "54,90 ¬"
```

### Site con Address, Coordinates, DateRange
```php
$site = Site::create([
    'code' => 'SITE-001',
    'name' => 'Cantiere Centro',
    'address' => new Address(
        street: 'Via Roma 123',
        city: 'Milano',
        province: 'MI',
        postalCode: '20121'
    ),
    'location' => new Coordinates(45.4642, 9.1900),
    'work_period' => new DateRange(
        start: Carbon::parse('2025-01-01'),
        end: Carbon::parse('2025-12-31')
    ),
]);

// Verifica timbratura operaio
$workerLocation = new Coordinates(45.4640, 9.1895);
if ($site->location->isWithinRadiusMeters($workerLocation, 100)) {
    // OK - entro 100m dal cantiere
}

// Verifica periodo attivo
if ($site->work_period->isActive()) {
    // OK - cantiere attivo
}

// Durata lavori
echo "Durata: {$site->work_period->getDurationInDays()} giorni";
```

### Quote con Money calcoli complessi
```php
$quote = Quote::find(1);

// Somma tutti i line items
$subtotal = Money::EUR(0);
foreach ($quote->items as $item) {
    $lineTotal = $item->price->multiply($item->quantity);
    $subtotal = $subtotal->add($lineTotal);
}

// Applica sconto globale
if ($quote->discount_percentage) {
    $subtotal = $quote->discount_percentage->applyTo($subtotal);
}

// Aggiungi IVA
$vat = Percentage::vat();
$total = $vat->applyTo($subtotal, false);

echo "Totale: {$total->format()}"; // "1.220,00 ¬"
```

---

##  Vantaggi dei Value Objects

1. **Type Safety** - PHP garantisce i tipi
2. **Validazione Automatica** - Si valida nel costruttore
3. **Immutabilità** - Previene bug da modifiche accidentali
4. **Riusabilità** - Stesso codice in tutti i models
5. **Testabilità** - Facili da testare senza DB
6. **Espressività** - Codice più leggibile
7. **Centralizzazione Logica** - Regole in un solo posto

### Prima (senza Value Objects)
```php
// L Logica sparsa, ripetuta, error-prone
$finalPrice = $price - ($price * $discount / 100);
$finalPrice = $finalPrice + ($finalPrice * $vat / 100);
$formatted = number_format($finalPrice, 2, ',', '.') . ' ¬';

// Distanza calcolata male in 10 posti diversi =1
$distance = sqrt(pow($lat2-$lat1,2) + pow($lng2-$lng1,2));
```

### Dopo (con Value Objects)
```php
//  Leggibile, corretto, riutilizzabile
$finalPrice = $discount->applyTo($price);
$finalPrice = $vat->applyTo($finalPrice, false);
echo $finalPrice->format();

//  Calcolo distanza corretto (Haversine formula)
$distance = $site->location->distanceTo($worker->location);
```

---

## =€ Come Estendere

### Creare un nuovo Value Object

```php
namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;

class PhoneNumber implements Castable
{
    public function __construct(
        public readonly string $number,
        public readonly string $countryCode = '+39'
    ) {
        $this->validate();
    }

    public function format(): string {
        // Logic...
    }

    private function validate(): void {
        // Validation...
    }

    // Eloquent cast implementation...
}
```

### Usarlo nel Model
```php
protected function casts(): array {
    return ['phone' => PhoneNumber::class];
}
```

---

## =Ú Riferimenti

- [Value Objects - Martin Fowler](https://martinfowler.com/bliki/ValueObject.html)
- [DDD Value Objects](https://dddinphp.org/value-objects)
- [Laravel Custom Casts](https://laravel.com/docs/eloquent-mutators#custom-casts)

---

**Autore:** Davide Donghi
**Data:** Gennaio 2025
**Progetto:** DGGM ERP
