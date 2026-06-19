# DDD Guide — DGGM ERP

**Scopo**: Guida completa ai pattern DDD applicati al progetto DGGM.
**Da leggere prima di modificare qualsiasi struttura.**
**Ultimo aggiornamento**: Aprile 2026

---

## Indice

1. [Concetti fondamentali](#1-concetti-fondamentali)
2. [Aggregati e Aggregate Root](#2-aggregati-e-aggregate-root)
3. [Rich Domain Model — calcoli sui modelli](#3-rich-domain-model--calcoli-sui-modelli)
4. [Value Objects](#4-value-objects)
5. [Domain Services](#5-domain-services)
6. [Actions — operazioni di scrittura](#6-actions--operazioni-di-scrittura)
7. [Queries — operazioni di lettura](#7-queries--operazioni-di-lettura)
8. [Application Services — orchestrazione](#8-application-services--orchestrazione)
9. [Struttura cartelle](#9-struttura-cartelle)
10. [Organizzazione delle rotte](#10-organizzazione-delle-rotte)
11. [Alberi decisionali](#11-alberi-decisionali)
12. [Anti-pattern da evitare](#12-anti-pattern-da-evitare)
13. [Strategia di migrazione](#13-strategia-di-migrazione)
14. [Elementi di supporto — Enum, Job, Mail, Notification](#14-elementi-di-supporto--enum-job-mail-notification)
15. [Repository Pattern — perché NON usarlo](#15-repository-pattern--perché-non-usarlo)
16. [Refactoring pratico — il modello Quote](#16-refactoring-pratico--il-modello-quote)

---

## 1. Concetti fondamentali

### Cos'è DDD

Domain-Driven Design è un approccio che organizza il codice attorno al **business**, non attorno alla tecnologia. La struttura delle cartelle riflette i domini di business, non i tipi tecnici.

### Prima e dopo

```
PRIMA (organizzazione per tipo tecnico)       DOPO (organizzazione per dominio)
──────────────────────────────────────        ─────────────────────────────────
app/
├── Models/            ← 78 file piatti       app/
├── Data/              ← 85 file piatti       ├── Domains/
├── Services/          ← 47 file piatti       │   ├── Quote/
├── Actions/Quote/     ← ok                   │   │   ├── Models/
└── Queries/Quote/     ← ok                   │   │   ├── Data/
                                              │   │   ├── Actions/
                                              │   │   ├── Queries/
                                              │   │   └── Services/
                                              │   └── Shared/
                                              └── ApplicationServices/
```

### Bounded Context (Contesto Delimitato)

Un bounded context è un confine esplicito dentro al quale un modello di dominio è consistente e coerente. Nel progetto DGGM i bounded context sono:

| Contesto | Responsabilità | Aggregate Root principali |
|----------|---------------|--------------------------|
| **Quote** | Preventivi e conversione a progetto | Quote |
| **Project** | Gestione cantieri e ciclo di vita | Project |
| **Warehouse** | Magazzino, movimenti, DDT | Warehouse, Inventory |
| **Rental** | Noleggio, prezzi, ispezioni | RentalProfile, PriceList |
| **Registry** | Anagrafica clienti, fornitori, operai | Customer, Supplier, Worker |
| **Product** | Catalogo prodotti e listini | Product |
| **FinalBalance** | Consuntivi | FinalBalance |
| **Shared** | Servizi cross-dominio | — |

---

## 2. Aggregati e Aggregate Root

### Cos'è un aggregato

Un aggregato è un **cluster di entità** che hanno senso solo insieme e vengono trattate come un'unità atomica per le modifiche. Ogni aggregato ha un **Aggregate Root** — l'unico punto di accesso dall'esterno.

### Regola fondamentale

> Non accedi mai a un'entità figlio direttamente dall'esterno. Passi sempre dall'Aggregate Root.

```php
// ✅ CORRETTO — accedi a QuoteItem tramite Quote
$quote->items->sum('subtotal');
$quote->items()->create([...]);

// ❌ SBAGLIATO — accedi direttamente a QuoteItem
QuoteItem::where('quote_id', $id)->sum('subtotal');
```

### Gli aggregati nel progetto DGGM

```
Quote (Aggregate Root)
├── QuoteItem              ← parte del Quote, vive e muore con esso
├── QuoteDeposit           ← parte del Quote
└── QuoteToken             ← parte del Quote

Project (Aggregate Root)
├── ProjectMaterial        ← parte del Project
├── ProjectWorker          ← parte del Project
├── ProjectExpense         ← parte del Project
├── ProjectLaborCost       ← parte del Project
├── ProjectLaborLog        ← parte del Project
└── ProjectService         ← parte del Project

Customer (Aggregate Root)
└── (indirizzi, contatti se presenti)

Product (Aggregate Root)
├── ProductComponent       ← parte del Product
└── ProductRelation        ← parte del Product
```

### FK interna vs FK esterna — la distinzione chiave

```php
// QuoteItem.quote_id
// → FK INTERNA: QuoteItem appartiene all'aggregato Quote
// → Non ha senso senza Quote, si elimina con Quote
// → Si accede sempre tramite $quote->items

// Quote.customer_id
// → FK ESTERNA: Customer è un aggregato separato
// → Quote "conosce" il Customer tramite ID, non lo possiede
// → Un calcolo che usa Quote + Customer attraversa DUE aggregati

// Quote.project_id
// → FK ESTERNA: Project è un aggregato separato
// → La conversione Quote → Project è un'operazione cross-aggregato
//    → va in un Application Service
```

---

## 3. Rich Domain Model — calcoli sui modelli

### Il problema: Anemic Domain Model

Il pattern più comune (e sbagliato) è l'**Anemic Domain Model**: i modelli sono contenitori di dati vuoti, tutta la logica è nei Service.

```php
// ❌ ANEMIC — Quote è solo dati, logica altrove
class Quote extends Model
{
    // solo $fillable, $casts, relazioni...
}

// Tutta la logica nel Service (sbagliato)
class QuoteService
{
    public function calculateTotal(Quote $quote): float
    {
        return $quote->items->sum(fn($i) => $i->quantity * $i->unit_price);
    }

    public function isExpired(Quote $quote): bool
    {
        return $quote->valid_until?->isPast() ?? false;
    }
}
```

### La soluzione: Rich Domain Model

Se un calcolo usa **solo dati di quell'entità**, appartiene **sul modello**.

```php
// ✅ RICH — Quote ha comportamento intrinseco
class Quote extends Model
{
    public function calculateSubtotal(): float
    {
        return $this->items->sum(fn(QuoteItem $item) => $item->subtotal());
    }

    public function calculateTotal(): float
    {
        $subtotal = $this->calculateSubtotal();
        $discount = $subtotal * ($this->discount_percent / 100);
        $taxable  = $subtotal - $discount;

        return $this->tax_included
            ? $taxable * (1 + $this->tax_rate / 100)
            : $taxable;
    }

    public function isExpired(): bool
    {
        return $this->valid_until && $this->valid_until->isPast();
    }

    public function canBeConverted(): bool
    {
        return $this->status === 'approved' && is_null($this->project_id);
    }

    public function canBeSent(): bool
    {
        return in_array($this->status, ['draft', 'revision']);
    }
}

// QuoteItem conosce il suo subtotale
class QuoteItem extends Model
{
    public function subtotal(): float
    {
        $gross    = $this->quantity * $this->unit_price;
        $discount = $gross * ($this->applied_discount_percent / 100);
        return $gross - $discount;
    }

    public function isRentalItem(): bool
    {
        return $this->type === 'rental';
    }
}

// Project conosce il suo stato finanziario
class Project extends Model
{
    public function isOverBudget(): bool
    {
        return $this->actual_cost > $this->budget_amount;
    }

    public function budgetVariance(): float
    {
        return $this->budget_amount - $this->actual_cost;
    }

    public function budgetUsagePercent(): float
    {
        if ($this->budget_amount <= 0) { return 0; }
        return ($this->actual_cost / $this->budget_amount) * 100;
    }
}
```

### Regola pratica

> **Un metodo va sul modello se**: rimuovendo il modello dalla firma, il metodo non ha più senso.
>
> `calculateTotal()` su Quote → ha senso solo per Quote → va su Quote
>
> `calculateDistance(Quote $quote, Customer $customer)` → attraversa due aggregati → va nel Domain Service

---

## 4. Value Objects

### Cos'è un Value Object

Un Value Object rappresenta un **concetto di dominio** (denaro, coordinate, percentuale) senza identità propria. Due Money con lo stesso valore sono identici.

```
Entity: ha identità (Customer con id=5 è diverso da Customer con id=6)
Value Object: definito dai suoi valori (€10,00 === €10,00, qualunque sia l'istanza)
```

### Regola: Value Object contiene comportamento sul suo concetto

```php
// app/ValueObjects/Money.php
class Money
{
    public function __construct(
        public readonly float $amount,
        public readonly string $currency = 'EUR',
    ) {}

    // ✅ Operazioni matematiche sul concetto "denaro"
    public function add(Money $other): self
    {
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function subtract(Money $other): self
    {
        return new self($this->amount - $other->amount, $this->currency);
    }

    public function multiply(float $factor): self
    {
        return new self($this->amount * $factor, $this->currency);
    }

    public function discountBy(Percentage $percent): self
    {
        return new self($this->amount * (1 - $percent->decimal()), $this->currency);
    }

    public function applyVat(float $rate = 22.0): self
    {
        return new self($this->amount * (1 + $rate / 100), $this->currency);
    }

    // ✅ Predicati sul concetto
    public function isZero(): bool { return $this->amount === 0.0; }
    public function isPositive(): bool { return $this->amount > 0; }
    public function isGreaterThan(Money $other): bool { return $this->amount > $other->amount; }

    // ✅ Formattazione
    public function format(): string
    {
        return number_format($this->amount, 2, ',', '.') . ' €';
    }

    public static function zero(): self { return new self(0.0); }
    public static function of(float $amount): self { return new self($amount); }

    // ❌ NO calcoli complessi (markup, sconto cliente) → vanno nel Domain Service
}

// app/ValueObjects/Percentage.php
class Percentage
{
    public function __construct(public readonly float $value) {}

    public function decimal(): float { return $this->value / 100; }
    public function complement(): self { return new self(100 - $this->value); }
    public function format(): string { return "{$this->value}%"; }

    public static function zero(): self { return new self(0); }
}

// app/ValueObjects/DateRange.php
class DateRange
{
    public function __construct(
        public readonly Carbon $start,
        public readonly Carbon $end,
    ) {}

    public function durationInDays(): int { return $this->start->diffInDays($this->end); }
    public function durationInHours(): float { return $this->start->diffInHours($this->end); }

    public function overlaps(DateRange $other): bool
    {
        return $this->start < $other->end && $this->end > $other->start;
    }

    public function contains(Carbon $date): bool
    {
        return $date->between($this->start, $this->end);
    }
}
```

### Value Object vs Domain Service — la regola

```
Value Object  → comportamento INTRINSECO al concetto
                Money::add(), Percentage::decimal(), DateRange::overlaps()

Domain Service → comportamento che USA più concetti
                PriceCalculatorService::applyCustomerDiscount(Money $price, Customer $customer)
```

---

## 5. Domain Services

### Quando usare un Domain Service

Un Domain Service gestisce calcoli o logiche che:
- Coinvolgono **più aggregati** (non hanno un "home" naturale su nessun modello)
- Sono **pure** — nessuna scrittura su DB, nessuna infrastruttura
- Rappresentano regole di business non banali

```
Calcolo usa dati di 1 aggregato?    → Metodo sul Model
Calcolo usa un concetto di dominio? → Value Object
Calcolo attraversa più aggregati?   → Domain Service  ← qui
```

### Esempi nel progetto DGGM

#### QuoteDiscountResolverService — attraversa Quote + Customer

```php
// app/Domains/Quote/Services/QuoteDiscountResolverService.php
//
// PERCHÉ non va su Quote::resolveDiscount()?
// → Perché ha bisogno di Customer (aggregato separato)
// → Quote non deve "conoscere" Customer per fare calcoli su se stesso
//
// PERCHÉ non va su un Application Service?
// → Perché è un calcolo puro, non scrive su DB, non ha side-effects
// → Un AS orchestrerebbe Actions; questo risolve solo valori

class QuoteDiscountResolverService
{
    public function resolveForItems(Collection $items, Customer $customer): Collection
    {
        $family   = $customer->discountFamily;
        $baseRate = (float) ($customer->base_discount_percent ?? 0);

        return $items->map(function (QuoteItem $item) use ($family, $baseRate): array {
            $productRate = $family?->discountFor($item->product_id) ?? 0;

            // Regola business: si applica il maggiore tra base cliente e specifico prodotto
            $finalRate = max($baseRate, (float) $productRate);

            return [
                'quote_item_id'            => $item->id,
                'applied_discount_percent' => $finalRate,
            ];
        });
    }
}
```

#### OvertimeCalculatorService — attraversa Worker + OvertimeTier + ore lavorate

```php
// app/Domains/Project/Services/OvertimeCalculatorService.php

class OvertimeCalculatorService
{
    public function calculate(Worker $worker, float $hoursWorked, DateRange $period): OvertimeResult
    {
        $tiers      = $worker->overtimeTiers->sortByDesc('threshold_hours');
        $normalRate = $worker->currentRate()?->hourly_rate ?? 0;

        $normalHours   = min($hoursWorked, 8.0);
        $overtimeHours = max(0, $hoursWorked - 8.0);

        $multiplier = $tiers
            ->first(fn($tier) => $overtimeHours >= $tier->threshold_hours)
            ?->multiplier ?? 1.0;

        return new OvertimeResult(
            normalHours:   $normalHours,
            overtimeHours: $overtimeHours,
            normalPay:     Money::of($normalHours * $normalRate),
            overtimePay:   Money::of($overtimeHours * $normalRate * $multiplier),
        );
    }
}
```

#### RentalEngineService — formula Power-Decay pura

```php
// app/Domains/Rental/Services/RentalEngineService.php
// Questo service è già corretto nel progetto — calcolo puro, zero DB.

class RentalEngineService
{
    public function calculateDurationMultiplier(float $days, RentalProfile $profile): float
    {
        if ($days <= 1) { return 1.0; }

        $decay  = 1 - (log($days) / log($profile->max_duration_reference)) * $profile->decay_strength;
        $result = ($days ** $profile->exponent_curve) * $decay + $profile->duration_offset;

        $floor = $this->calculateDurationMultiplier($profile->max_period_cap_days, $profile);
        return max($result, $floor);
    }
}
```

### Dove NON va un Domain Service

```php
// ❌ QuoteService.getAll() — fa DB query → è una QUERY, non un Service
class QuoteService
{
    public function getAll(): LengthAwarePaginator
    {
        return Quote::with(['customer'])->paginate(); // DB!
    }
}

// ✅ Corretto: GetQuotesQuery
class GetQuotesQuery
{
    public function execute(array $filters = []): LengthAwarePaginator
    {
        return Quote::query()
            ->with(['customer', 'items'])
            ->when($filters['status'] ?? null, fn($q, $s) => $q->where('status', $s))
            ->paginate(15);
    }
}
```

---

## 6. Actions — operazioni di scrittura

### Responsabilità

Le Actions gestiscono **una singola operazione di scrittura** su un aggregato. Sempre atomiche con `DB::transaction()`, sempre dispatchano Events dopo la persistenza.

```php
// app/Domains/Quote/Actions/CreateQuoteAction.php

class CreateQuoteAction
{
    public function __construct(
        private readonly QuoteDiscountResolverService $discountResolver,
    ) {}

    public function execute(QuoteData $data): Quote
    {
        return DB::transaction(function () use ($data) {
            $quote = Quote::create($data->except('items')->toArray());

            // Crea gli items
            $quote->items()->createMany($data->items->toArray());

            // Domain Service: risolve e storicizza gli sconti
            // (Customer è un aggregato diverso → Domain Service)
            if ($data->customer_id) {
                $customer = Customer::find($data->customer_id);
                $resolved = $this->discountResolver->resolveForItems($quote->items, $customer);

                foreach ($resolved as $row) {
                    $quote->items()->where('id', $row['quote_item_id'])
                        ->update(['applied_discount_percent' => $row['applied_discount_percent']]);
                }
            }

            QuoteCreated::dispatch($quote, [
                'created_by' => auth()->id(),
            ]);

            return $quote->refresh();
        });
    }
}
```

### Regole delle Actions

```
✅ DEVE: Accettare Spatie Data DTO come parametro
✅ DEVE: Usare DB::transaction() per atomicità
✅ DEVE: Dispatchare Events DOPO la persistenza
✅ DEVE: Restituire il Model Eloquent
✅ PUÒ:  Iniettare Domain Services per calcoli
✅ PUÒ:  Chiamare altre Actions solo se indispensabile

❌ NON:  Contenere logica HTTP (nessun $request)
❌ NON:  Fare query complesse di lettura (usa Query)
❌ NON:  Orchestrare operazioni su più domini (usa Application Service)
```

---

## 7. Queries — operazioni di lettura

### Quando usare una Query Class

```
Query semplice (1-3 WHERE)   → Eloquent diretto nel Controller
Query complessa               → Query Class dedicata
```

```php
// app/Domains/Quote/Queries/GetQuotesQuery.php

class GetQuotesQuery
{
    public function execute(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Quote::query()
            ->with(['customer', 'projectManager', 'items'])
            ->when($filters['status'] ?? null,      fn($q, $s)  => $q->where('status', $s))
            ->when($filters['customer_id'] ?? null, fn($q, $id) => $q->where('customer_id', $id))
            ->when($filters['search'] ?? null,      fn($q, $s)  => $q->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                  ->orWhere('title', 'like', "%{$s}%");
            }))
            ->orderBy($filters['sort_by'] ?? 'created_at', $filters['sort_order'] ?? 'desc')
            ->paginate(min($perPage, 100));
    }
}

// Controller (thin)
public function index(Request $request): JsonResponse
{
    $this->authorize('viewAny', Quote::class);

    $quotes = app(GetQuotesQuery::class)->execute($request->all());

    return response()->json([
        'success' => true,
        'data'    => QuoteData::collection($quotes->items()),
        'meta'    => ['current_page' => $quotes->currentPage(), 'total' => $quotes->total()],
    ]);
}
```

---

## 8. Application Services — orchestrazione

### Cos'è un Application Service

Un Application Service coordina un **caso d'uso completo** che attraversa più domini. Non contiene logica di business diretta — la delega a Domain Services e Actions.

```
Application Service = USE CASE (cosa fa l'utente)
Domain Service      = CALCOLO cross-aggregato (come si calcola)
Action              = SCRITTURA atomica su 1 aggregato
```

### Quando serve

Un Application Service serve quando un'operazione:
1. Scrive su **più aggregati** (es. chiude Quote E crea Project)
2. Coordina **più Actions** in sequenza
3. Necessita di **rollback coordinato** tra operazioni diverse

### Esempio 1: ConvertQuoteToProject

```php
// app/ApplicationServices/Quote/ConvertQuoteToProjectApplicationService.php
//
// PERCHÉ non è una semplice Action?
// → Scrive su Quote (chiude) E crea Project (aggregato diverso)
// → Coordina più operazioni che devono riuscire o fallire insieme

class ConvertQuoteToProjectApplicationService
{
    public function __construct(
        private readonly CreateProjectAction $createProject,
        private readonly UpdateQuoteAction   $updateQuote,
        private readonly ReserveInventoryAction $reserveInventory,
    ) {}

    public function execute(Quote $quote): Project
    {
        if (! $quote->canBeConverted()) {
            throw new QuoteCannotBeConvertedException($quote);
        }

        return DB::transaction(function () use ($quote) {
            // 1. Crea il Project (Domains/Project)
            $project = $this->createProject->execute(
                ProjectData::fromQuote($quote)
            );

            // 2. Chiude la Quote (Domains/Quote)
            $this->updateQuote->execute($quote, QuoteData::from([
                'status'     => 'converted',
                'project_id' => $project->id,
            ]));

            // 3. Prenota materiali se ci sono item di magazzino (Domains/Warehouse)
            foreach ($quote->items->where('type', 'material') as $item) {
                $this->reserveInventory->execute($project, $item);
            }

            // Evento cross-dominio — ascoltato da più listener
            QuoteConvertedToProject::dispatch($quote, $project, [
                'converted_by' => auth()->id(),
            ]);

            return $project;
        });
    }
}
```

### Esempio 2: SendQuote

```php
// app/ApplicationServices/Quote/SendQuoteApplicationService.php
//
// PERCHÉ non è una Action?
// → Coordina: PDF (Shared), Email (Shared), stato Quote (Quote domain), log (Email domain)
// → È un caso d'uso completo con infrastruttura esterna

class SendQuoteApplicationService
{
    public function __construct(
        private readonly PdfService          $pdf,
        private readonly TenantMailService   $mailer,
        private readonly UpdateQuoteAction   $updateQuote,
    ) {}

    public function execute(Quote $quote, ?string $recipientEmail = null): void
    {
        $email = $recipientEmail ?? $quote->customer->email;

        // Shared/Services — genera PDF
        $pdfPath = $this->pdf->generateQuote($quote);

        // Shared/Services — invia email
        $this->mailer->send(
            to:          $email,
            template:    'emails.quote',
            data:        ['quote' => $quote],
            attachments: [$pdfPath],
        );

        // Actions/Quote — aggiorna stato
        $this->updateQuote->execute($quote, QuoteData::from(['status' => 'sent']));

        // Event — side-effects (log, notifiche)
        QuoteSent::dispatch($quote, auth()->user());
    }
}
```

### Esempio 3: GenerateFinalBalance

```php
// app/ApplicationServices/FinalBalance/GenerateFinalBalanceApplicationService.php
//
// PERCHÉ un Application Service?
// → Legge da Project, Materials, LaborCosts, Expenses (query cross-dominio)
// → Crea FinalBalance + FinalBalanceItems (scrittura su un aggregato)
// → Usa FinalBalanceCalculatorService (Domain Service) per i calcoli

class GenerateFinalBalanceApplicationService
{
    public function __construct(
        private readonly FinalBalanceCalculatorService $calculator,
        private readonly CreateFinalBalanceAction      $createBalance,
    ) {}

    public function execute(Project $project, GenerateFinalBalanceData $data): FinalBalance
    {
        // Carica tutto il necessario (cross-dominio, solo lettura)
        $project->loadMissing([
            'quote.items',
            'laborCosts',
            'expenses',
            'projectMaterials.product',
        ]);

        // Domain Service: calcola i totali (logica pura, no DB)
        $pnl = $this->calculator->compute($project);

        // Action: scrive il FinalBalance (1 aggregato)
        return $this->createBalance->execute(
            CreateFinalBalanceData::fromPnl($project, $pnl, $data)
        );
    }
}
```

### Regole degli Application Services

```
✅ DEVE: Orchestrare Actions e Domain Services
✅ DEVE: Gestire il caso d'uso completo (input → output)
✅ PUÒ:  Usare DB::transaction() per coordinare più Actions
✅ PUÒ:  Chiamare Query Classes per leggere dati necessari
✅ PUÒ:  Iniettare Shared Services (PdfService, TenantMailService)

❌ NON:  Contenere logica di business diretta (delega a Domain Services)
❌ NON:  Contenere validazione HTTP (quella è nel Controller via Spatie Data)
❌ NON:  Essere usato per operazioni su 1 solo aggregato (usa Action)
```

---

## 9. Struttura cartelle

### Struttura completa target

```
app/
│
├── Domains/
│   │
│   ├── Quote/
│   │   ├── Actions/
│   │   │   ├── CreateQuoteAction.php
│   │   │   ├── UpdateQuoteAction.php
│   │   │   ├── DeleteQuoteAction.php
│   │   │   ├── ApproveQuoteAction.php
│   │   │   ├── SendQuoteAction.php          ← se atomica
│   │   │   ├── DuplicateQuoteAction.php
│   │   │   └── RestoreQuoteAction.php
│   │   ├── Queries/
│   │   │   ├── GetQuotesQuery.php
│   │   │   ├── GetQuoteByIdQuery.php
│   │   │   ├── GetPendingQuotesQuery.php
│   │   │   ├── GetExpiredQuotesQuery.php
│   │   │   └── GetCustomerQuotesQuery.php
│   │   ├── Data/
│   │   │   ├── QuoteData.php
│   │   │   ├── QuoteItemData.php
│   │   │   └── QuoteDepositData.php
│   │   ├── Models/
│   │   │   ├── Quote.php                    ← con metodi Rich Domain Model
│   │   │   ├── QuoteItem.php
│   │   │   ├── QuoteDeposit.php
│   │   │   ├── QuoteTemplate.php
│   │   │   └── QuoteToken.php
│   │   ├── Events/
│   │   │   ├── QuoteCreated.php
│   │   │   ├── QuoteApproved.php
│   │   │   └── QuoteConvertedToProject.php
│   │   ├── Policies/
│   │   │   └── QuotePolicy.php
│   │   └── Services/                        ← Domain Services (solo calcoli)
│   │       ├── QuoteDiscountResolverService.php
│   │       ├── QuoteCalculationService.php
│   │       └── QuoteTermsService.php
│   │
│   ├── Project/
│   │   ├── Actions/
│   │   ├── Queries/
│   │   ├── Data/
│   │   ├── Models/
│   │   ├── Events/
│   │   ├── Policies/
│   │   └── Services/
│   │       ├── ProjectCostCalculatorService.php
│   │       ├── OvertimeCalculatorService.php
│   │       ├── AvailabilityCalculatorService.php
│   │       └── OrderListCalculatorService.php
│   │
│   ├── Warehouse/
│   │   ├── Actions/
│   │   ├── Queries/
│   │   ├── Data/
│   │   ├── Models/
│   │   ├── Events/
│   │   ├── Policies/
│   │   └── Services/
│   │       ├── InventoryService.php          ← già corretto (puro calcolo)
│   │       └── QuarantineCalculatorService.php
│   │
│   ├── Rental/
│   │   ├── Actions/
│   │   ├── Queries/
│   │   ├── Data/
│   │   ├── Models/
│   │   ├── Events/
│   │   ├── Policies/
│   │   └── Services/
│   │       ├── RentalEngineService.php       ← già corretto (puro calcolo)
│   │       ├── SubrentalPricingService.php
│   │       └── CommercialFactorService.php
│   │
│   ├── Registry/                             (Customer, Supplier, Worker, Contractor)
│   │   ├── Actions/
│   │   ├── Queries/
│   │   ├── Data/
│   │   ├── Models/
│   │   ├── Policies/
│   │   └── Services/
│   │       └── WorkerRateCalculatorService.php
│   │
│   ├── Product/
│   │   ├── Actions/
│   │   ├── Queries/
│   │   ├── Data/
│   │   ├── Models/
│   │   ├── Policies/
│   │   └── Services/
│   │       └── ProductPricingService.php
│   │
│   ├── FinalBalance/
│   │   ├── Actions/
│   │   ├── Queries/
│   │   ├── Data/
│   │   ├── Models/
│   │   └── Services/
│   │       └── FinalBalanceCalculatorService.php
│   │
│   └── Shared/                               ← servizi usati da più domini
│       ├── Services/
│       │   ├── PdfService.php
│       │   ├── GeolocationService.php
│       │   ├── TenantMailService.php
│       │   ├── EmbeddingService.php
│       │   ├── CodeGeneratorService.php
│       │   └── OAuthTokenRefreshService.php
│       └── ValueObjects/                     (oppure app/ValueObjects/ — già ok)
│           ├── Money.php
│           ├── Coordinates.php
│           ├── DateRange.php
│           └── Percentage.php
│
├── ApplicationServices/                      ← orchestrazione cross-dominio
│   ├── Quote/
│   │   ├── ConvertQuoteToProjectApplicationService.php
│   │   └── SendQuoteApplicationService.php
│   ├── Project/
│   │   ├── GenerateFinalBalanceApplicationService.php
│   │   └── RunAvailabilityCheckApplicationService.php
│   └── Warehouse/
│       └── ProcessRentalReturnApplicationService.php
│
├── Http/
│   └── Controllers/Api/V1/                  ← INVARIATO (adapter HTTP)
│
├── Landlord/                                ← già separato, va bene così
│
├── Events/                                  ← rimane flat (pochi eventi cross-dominio)
├── Listeners/                               ← rimane flat
└── Jobs/                                    ← rimane flat
```

### Namespace dopo la migrazione

```php
// Prima
use App\ApplicationServices\Quote\SendQuoteApplicationService;use App\Domains\Quote\Models\Quote;use App\Domains\Quote\Services\QuoteCalculationService;use App\Domains\Shared\Services\PdfService;use App\Services\QuoteCalculationService;

// Dopo

```

---

## 10. Organizzazione delle rotte

### Struttura

```
routes/
├── api.php                  ← entry point, ~40 righe
└── api/
    ├── auth.php             ← login, register, reset, sessioni, global auth
    ├── landlord.php         ← admin landlord, piani, broadcast, monitoring
    ├── settings.php         ← settings, feature flags, codici
    ├── registry.php         ← customers, suppliers, contractors
    ├── quotes.php           ← quotes (CRUD + actions + PDF) + public quote
    ├── products.php         ← products, categories, brands, media, pricing
    ├── projects.php         ← projects + sub-routes (materials, workers, expenses)
    ├── warehouse.php        ← feature:warehouse (inventory, DDT, repair)
    ├── workers.php          ← feature:workers (workers, rates, invitations)
    ├── rental.php           ← feature:rental (profiles, analytics, price lists)
    ├── notifications.php    ← notifiche
    └── shared.php           ← media, import, misc
```

### Entry point api.php

```php
<?php
// routes/api.php

use Illuminate\Support\Facades\Route;

// Redirect password reset a frontend
Route::get('/password-reset/{token}', function ($token) {
    return redirect()->away(
        config('app.frontend_url') . '/reset-password?token=' . $token
        . '&email=' . request()->query('email')
    );
})->name('password.reset');

Route::prefix('v1')->group(function () {

    // ── Pubbliche (no auth) ────────────────────────────────────────────
    require __DIR__ . '/api/auth.php';
    require __DIR__ . '/api/landlord.php';

    // ── Protette (auth:sanctum) ────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        require __DIR__ . '/api/settings.php';
        require __DIR__ . '/api/registry.php';
        require __DIR__ . '/api/quotes.php';
        require __DIR__ . '/api/products.php';
        require __DIR__ . '/api/projects.php';
        require __DIR__ . '/api/notifications.php';
        require __DIR__ . '/api/shared.php';

        // Feature-gated (middleware interno ai file)
        require __DIR__ . '/api/warehouse.php';
        require __DIR__ . '/api/workers.php';
        require __DIR__ . '/api/rental.php';
    });
});
```

### Esempio file dominio — quotes.php

```php
<?php
// routes/api/quotes.php

use App\Http\Controllers\Api\V1\Quotes\PublicQuoteActionController;use App\Http\Controllers\Api\V1\Quotes\QuoteController;use Illuminate\Support\Facades\Route;

// Rotte pubbliche (escono dal middleware auth:sanctum del parent)
Route::withoutMiddleware('auth:sanctum')->group(function () {
    Route::get('public/quotes/{token}',        [PublicQuoteActionController::class, 'show']);
    Route::get('public/quotes/{token}/accept', [PublicQuoteActionController::class, 'accept']);
    Route::get('public/quotes/{token}/reject', [PublicQuoteActionController::class, 'reject']);
});

// CRUD base
Route::apiResource('quotes', QuoteController::class);

// Gestione stato
Route::patch('quotes/{quote}/status',      [QuoteController::class, 'changeStatus']);
Route::post('quotes/{quote}/approve',      [QuoteController::class, 'approve']);
Route::post('quotes/{quote}/reject',       [QuoteController::class, 'reject']);
Route::post('quotes/{quote}/send',         [QuoteController::class, 'send']);
Route::post('quotes/{quote}/mark-as-sent', [QuoteController::class, 'markAsSent']);

// Azioni
Route::post('quotes/{quote}/convert-to-project', [QuoteController::class, 'convertToProject']);
Route::post('quotes/{quote}/save-pdf',           [QuoteController::class, 'savePdf']);
Route::post('quotes/{quote}/refresh-terms',      [QuoteController::class, 'refreshTerms']);
Route::post('quotes/{quote}/duplicate',          [QuoteController::class, 'duplicate']);

// PDF
Route::get('quotes/{quote}/pdf/download', [QuoteController::class, 'downloadPdf']);
Route::get('quotes/{quote}/pdf/preview',  [QuoteController::class, 'previewPdf']);
```

---

## 11. Alberi decisionali

### Dove metto questo calcolo?

```
Il calcolo usa solo dati di 1 entità/aggregato?
└── SÌ → Metodo sul Model
          Quote::calculateTotal(), Project::isOverBudget()

     NO → Riguarda un concetto di dominio (denaro, date, percentuale)?
          └── SÌ → Value Object
                    Money::discountBy(), DateRange::overlaps()

               NO → È solo calcolo/logica, nessuna scrittura DB?
                    └── SÌ → Domain Service (Domains/{Domain}/Services/)
                              OvertimeCalculatorService, RentalEngineService

                         NO → Ha bisogno di infrastruttura (DB, email, PDF)?
                              └── SÌ → Action (scrittura) o Query (lettura)
                                        oppure Application Service se cross-dominio
```

### Devo creare un Application Service?

```
L'operazione scrive su PIÙ aggregati/domini?
└── SÌ → Application Service
          ConvertQuoteToProject, SendQuote, GenerateFinalBalance

     NO → È una lettura complessa?
          └── SÌ → Query Class
               NO → È una scrittura su 1 aggregato?
                    └── SÌ → Action
                         NO → Logica pura / calcolo?
                              └── SÌ → Domain Service o metodo sul Model
```

### Dove metto questo Service esistente?

```
Il Service tocca il DB (query/write)?
└── SÌ  → ❌ Violazione! Refactor:
            - Se è solo lettura    → Query Class
            - Se è scrittura       → Action
            - Se è orchestrazione  → Application Service

     NO  → Riguarda un solo dominio?
            └── SÌ → Domains/{Domain}/Services/
                 NO → È usato da più domini?
                      └── SÌ → Domains/Shared/Services/
```

---

## 12. Anti-pattern da evitare

### ❌ Anemic Model + Service God

```php
// SBAGLIATO — Quote è solo dati
class Quote extends Model { /* solo relazioni */ }

// SBAGLIATO — Service conosce tutto di Quote
class QuoteService
{
    public function isExpired(Quote $quote): bool { ... }
    public function calculateTotal(Quote $quote): float { ... }
    public function canBeConverted(Quote $quote): bool { ... }
    // e fa anche DB...
    public function getAll(): Collection { return Quote::all(); }
}
```

```php
// CORRETTO — Quote ha comportamento
class Quote extends Model
{
    public function isExpired(): bool { ... }
    public function calculateTotal(): float { ... }
    public function canBeConverted(): bool { ... }
}

// GetQuotesQuery per le query DB
// Nessun QuoteService necessario per questi casi
```

### ❌ Application Service usato per operazioni atomiche

```php
// SBAGLIATO — non serve un AS per creare un Customer
class CreateCustomerApplicationService { ... }

// CORRETTO — è un'Action semplice (1 aggregato)
class CreateCustomerAction { ... }
```

### ❌ Domain Service che tocca il DB

```php
// SBAGLIATO
class QuoteCalculationService
{
    public function calculateTotal(int $quoteId): float
    {
        $quote = Quote::with('items')->find($quoteId); // ← DB!
        return $quote->items->sum('subtotal');
    }
}

// CORRETTO — riceve il model già caricato
class QuoteCalculationService
{
    public function calculateTotal(Quote $quote): float
    {
        // $quote deve essere già caricato con items dal chiamante
        return $quote->items->sum(fn($i) => $i->subtotal());
    }
}

// Ancora meglio: metodo sul Model
class Quote extends Model
{
    public function calculateTotal(): float
    {
        return $this->items->sum(fn($i) => $i->subtotal());
    }
}
```

### ❌ Controller fat

```php
// SBAGLIATO
public function convertToProject(Quote $quote): JsonResponse
{
    if ($quote->status !== 'approved') {
        return response()->json(['error' => 'Not approved'], 422);
    }

    $project = Project::create([...]);         // logica nel controller
    $quote->update(['status' => 'converted']); // scrittura nel controller
    Cache::forget('quotes');                   // side-effect nel controller

    return response()->json(['data' => $project]);
}

// CORRETTO
public function convertToProject(Quote $quote): JsonResponse
{
    $this->authorize('update', $quote);

    $project = app(ConvertQuoteToProjectApplicationService::class)->execute($quote);

    return response()->json(['success' => true, 'data' => ProjectData::from($project)]);
}
```

---

## 13. Strategia di migrazione

### Fase 1 — Models e Data (basso rischio)

Crea sottocartelle, sposta file, aggiorna namespace con find & replace nel progetto.

```bash
# Crea struttura
mkdir -p app/Domains/Quote/{Models,Data,Actions,Queries,Services,Events,Policies}

# Sposta modelli (poi aggiorna namespace + use statements)
mv app/Models/Quote.php        app/Domains/Quote/Models/Quote.php
mv app/Models/QuoteItem.php    app/Domains/Quote/Models/QuoteItem.php
mv app/Data/QuoteData.php      app/Domains/Quote/Data/QuoteData.php
mv app/Data/QuoteItemData.php  app/Domains/Quote/Data/QuoteItemData.php
```

Aggiorna namespace in ogni file:
```php
// Prima
namespace App\Models;

// Dopo
namespace App\Domains\Quote\Models;
```

Aggiorna tutti i `use` nel progetto con IDE find & replace:
```
App\Models\Quote        → App\Domains\Quote\Models\Quote
App\Data\QuoteData      → App\Domains\Quote\Data\QuoteData
```

### Fase 2 — Actions e Queries (zero rischio logica)

```bash
mv app/Actions/Quote/  app/Domains/Quote/Actions/
mv app/Queries/Quote/  app/Domains/Quote/Queries/
```

Aggiorna namespace in ogni file:
```php
namespace App\Actions\Quote;    → namespace App\Domains\Quote\Actions;
namespace App\Queries\Quote;    → namespace App\Domains\Quote\Queries;
```

### Fase 3 — Services (richiede audit)

Prima di spostare, verifica ogni Service:
- Tocca il DB? → Non è un Domain Service puro. Refactor prima.
- È usato da più domini? → Va in `Domains/Shared/Services/`
- È specifico di un dominio? → Va in `Domains/{Domain}/Services/`

### Fase 4 — Introduce Application Services

Solo per i casi cross-dominio che già esistono mascherati da Actions:
- `ConvertQuoteToProjectAction` → `ConvertQuoteToProjectApplicationService`
- `SendQuoteAction` (se orchestra più operazioni) → `SendQuoteApplicationService`
- `GenerateFinalBalanceAction` → `GenerateFinalBalanceApplicationService`

### Fase 5 — Rich Domain Model

Identifica metodi nei Services che usano solo dati di 1 aggregato e spostali sul Model.

### Ordine consigliato per dominio

```
Quote → Registry → Product → Warehouse → Rental → Project → FinalBalance
```

Quote è il più centrale e trae beneficio immediato. Project è il più complesso — farlo per ultimo.

### Verifica dopo ogni fase

```bash
php artisan route:list          # route binding ancora funzionante
php artisan test --compact      # nessuna regressione
./vendor/bin/pint               # stile ok
php artisan typescript:transform # tipi TS aggiornati
```

---

## 14. Elementi di supporto — Enum, Job, Mail, Notification

### Regola generale

> Se appartiene a un dominio, vive in quel dominio.
> Se è trasversale o infrastrutturale, resta piatto nelle cartelle Laravel standard.

### Elementi domain-specific

Ogni dominio può avere queste sottocartelle aggiuntive:

```
app/Domains/{Domain}/
├── Enums/
│   └── QuoteStatus.php            # enum di stato del dominio
├── Events/
│   └── QuoteApproved.php          # già trattato
├── Listeners/
│   └── SendQuoteApprovedMail.php  # seguono i loro eventi
├── Jobs/
│   └── GenerateQuotePdfJob.php    # task asincrono specifico del dominio
├── Mail/
│   └── QuoteSentMail.php          # mailable legato al dominio
├── Notifications/
│   └── QuoteApprovedNotification.php
├── Exceptions/
│   └── QuoteCannotBeApprovedException.php  # eccezione di business
├── Policies/
│   └── QuotePolicy.php            # già trattato
└── Observers/
    └── QuoteObserver.php          # se usi observers sul modello
```

#### Esempio Enum di stato

```php
// app/Domains/Quote/Enums/QuoteStatus.php
enum QuoteStatus: string
{
    case Draft     = 'draft';
    case Sent      = 'sent';
    case Approved  = 'approved';
    case Rejected  = 'rejected';
    case Converted = 'converted';
    case Expired   = 'expired';

    public function label(): string
    {
        return match($this) {
            self::Draft     => 'Bozza',
            self::Sent      => 'Inviato',
            self::Approved  => 'Approvato',
            self::Rejected  => 'Rifiutato',
            self::Converted => 'Convertito',
            self::Expired   => 'Scaduto',
        };
    }

    public function isEditable(): bool
    {
        return in_array($this, [self::Draft, self::Sent]);
    }
}
```

Gli enum di stato sono il **cuore del modello di dominio** — vanno sempre dentro il dominio, mai in una cartella generica `app/Enums/`.

#### Esempio Eccezione di business

```php
// app/Domains/Quote/Exceptions/QuoteCannotBeApprovedException.php
class QuoteCannotBeApprovedException extends \DomainException
{
    public function __construct(Quote $quote)
    {
        parent::__construct(
            "Il preventivo #{$quote->code} non può essere approvato nello stato: {$quote->status}"
        );
    }
}
```

### Elementi trasversali (restano piatti)

Questi elementi sono infrastruttura, non logica di dominio — non spostarli:

```
app/
├── Console/Commands/      # comandi Artisan — quasi sempre trasversali
├── Http/Middleware/       # middleware HTTP — infrastruttura
├── Providers/             # service providers — bootstrap applicazione
└── Exceptions/Handler.php # handler globale degli errori
```

### Elementi cross-dominio → Shared

Se un Job, Mail o Notification è usato da più domini, va in `Shared`:

```
app/Domains/Shared/
├── Jobs/
│   └── SendEmailJob.php           # invia email generica — usata da tutti
├── Mail/
│   └── GenericNotificationMail.php
└── Notifications/
    └── SystemAlertNotification.php
```

### Casts — dove metterli

```php
// Cast usato da un solo modello → dentro il dominio
app/Domains/Quote/Casts/MoneyAmountCast.php

// Cast riusabile da più modelli → Shared
app/Domains/Shared/Casts/MoneyCast.php
```

### Riepilogo rapido

| Elemento | Domain-specific | Cross-dominio | Infrastrutturale |
|---|---|---|---|
| **Enum** | `Domains/{D}/Enums/` | `Domains/Shared/Enums/` | — |
| **Job** | `Domains/{D}/Jobs/` | `Domains/Shared/Jobs/` | `Jobs/` (flat) |
| **Mail** | `Domains/{D}/Mail/` | `Domains/Shared/Mail/` | — |
| **Notification** | `Domains/{D}/Notifications/` | `Domains/Shared/Notifications/` | — |
| **Exception** | `Domains/{D}/Exceptions/` | — | `Exceptions/Handler.php` |
| **Observer** | `Domains/{D}/Observers/` | — | — |
| **Middleware** | — | — | `Http/Middleware/` |
| **Command** | — | — | `Console/Commands/` |
| **Provider** | — | — | `Providers/` |

---

## 15. Repository Pattern — perché NON usarlo

### Il pattern classico

```php
interface QuoteRepositoryInterface
{
    public function findById(int $id): ?Quote;
    public function findByCustomer(int $customerId): Collection;
    public function save(Quote $quote): void;
}

class EloquentQuoteRepository implements QuoteRepositoryInterface
{
    public function findById(int $id): ?Quote
    {
        return Quote::find($id);
    }
}

// Nel container
$this->app->bind(QuoteRepositoryInterface::class, EloquentQuoteRepository::class);
```

Sembra pulito. In realtà crea più problemi di quanti ne risolva.

### Perché non funziona con Eloquent

#### 1. L'astrazione perde comunque

Il repository restituisce un Eloquent Model. Chi lo riceve può ancora usare tutto Eloquent:

```php
$quote = $this->quoteRepo->findById(1); // "nasconde" Eloquent...

$quote->load('items');         // ← Eloquent diretto
$quote->customer->name;        // ← lazy loading Eloquent
$quote->update([...]);         // ← scrittura Eloquent diretta
```

L'astrazione dal layer di persistenza è **illusoria** — dipendi comunque da Eloquent ovunque nel codice.

#### 2. L'unico motivo valido è lo swap — che non farai mai

Il Repository con Interface serve per sostituire il backend di persistenza:

```php
// Test: array in memoria
$this->app->bind(QuoteRepositoryInterface::class, InMemoryQuoteRepository::class);

// Produzione: MySQL
$this->app->bind(QuoteRepositoryInterface::class, EloquentQuoteRepository::class);
```

Questo aveva senso nel 2010. Oggi Laravel ha `RefreshDatabase`, factories, SQLite in memoria — i test sul DB reale sono veloci. E se un giorno migrassi da MySQL a MongoDB, riscriveresti comunque tutto il codice che usa Eloquent — non solo i repository.

#### 3. Eloquent IS the repository

Eloquent implementa internamente il pattern Data Mapper. `Product::find()`, `Product::where()`, `Product::create()` sono già l'interfaccia al layer di persistenza. Aggiungere un Repository sopra è un'astrazione sull'astrazione.

### Cosa usi invece — che hai già

| Esigenza classica del Repository | Equivalente nel progetto |
|---|---|
| `findAllActive()` | `GetActiveQuotesQuery` |
| `findById()` | `Quote::findOrFail($id)` nel controller |
| `save()` / `create()` | `CreateQuoteAction`, `UpdateQuoteAction` |
| `delete()` | `DeleteQuoteAction` |
| Testabilità | `RefreshDatabase` + factories |

**Actions + Query Classes danno gli stessi benefici del Repository** — incapsulamento, testabilità, riusabilità — senza l'overhead dell'interfaccia che perde.

### L'unico caso in cui ha senso

Quando hai **due backend reali in produzione**, non solo in test:

```php
// Devi supportare MySQL E un sistema legacy SOAP
interface ProductCatalogInterface
{
    public function findBySku(string $sku): ProductData;
}

class EloquentProductCatalog implements ProductCatalogInterface { ... }
class SoapLegacyProductCatalog implements ProductCatalogInterface { ... }
```

Per DGGM questo scenario non esiste. Single-tenant, MySQL, nessun sistema legacy a livello di persistenza.

---

## 16. Refactoring pratico — il modello Quote

Questa sezione mostra un caso reale: il modello `Quote` come era originariamente e come va riorganizzato applicando i principi DDD.

### Cosa appartiene al modello

Un modello DDD ben strutturato contiene:

| Cosa | Motivazione |
|---|---|
| `$fillable`, `casts()` | Infrastruttura Eloquent |
| Relazioni | Mappa le associazioni dell'aggregato |
| Scope | Estensioni della query, "appartengono" al modello |
| Predicati (`canBe*`, `is*`, `has*`) | Logica su stato proprio, pura |
| Attributi computati puri | Calcolo su proprietà proprie, nessun DB |
| Metodi di transizione di stato | Cambiano proprietà — ma NON chiamano `save()` |
| `registerMediaCollections()` | Infrastruttura media |

**Regola**: se un metodo chiama `save()`, `update()`, `create()` — su se stesso o su altri modelli — è nel posto sbagliato.

### Cosa NON appartiene al modello

```
calculateTotals()     → fa query + saveQuietly() multipli → RecalculateQuoteTotalsAction
convertToProject()    → crea Project + ProjectMaterials   → ConvertQuoteToProjectService (AS)
createProjectProducts()→ logica interna a convertToProject → stessa Application Service
approve/reject/send() → chiamano $this->update()          → devono solo settare proprietà
booted() con Service  → genera il codice preventivo       → CreateQuoteAction
```

### Il pattern corretto per le transizioni di stato

```php
// ❌ PRIMA — il modello persiste se stesso
public function approve(): void
{
    $this->update([
        'status' => 'approved',
        'approved_date' => now(),
    ]);
}

// ✅ DOPO — il modello cambia solo le proprietà
public function approve(): void
{
    if (! $this->canBeApproved()) {
        throw new QuoteCannotBeApprovedException($this);
    }

    $this->status       = 'approved';
    $this->approved_date = now();
    // nessun save() — la persistenza è responsabilità dell'Action
}
```

L'Action è l'unico responsabile della persistenza:

```php
// app/Domains/Quote/Actions/ApproveQuoteAction.php
class ApproveQuoteAction
{
    public function execute(Quote $quote): Quote
    {
        return DB::transaction(function () use ($quote) {
            $quote->approve();  // setta proprietà
            $quote->save();     // l'Action persiste

            QuoteApproved::dispatch($quote, [
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            return $quote;
        });
    }
}
```

Stesso schema per `SendQuoteAction` e `RejectQuoteAction`.

### RecalculateQuoteTotalsAction + QuoteTotalsCalculatorService

Il calcolo dei totali ha **due responsabilità distinte** che devono essere separate:

```
Domain Service  →  calcolo puro sui dati già caricati (no DB, testabile in isolamento)
Action          →  carica i dati, chiama il Service, persiste i risultati
```

#### 1. Il DTO risultato

```php
// app/Domains/Quote/Data/QuoteTotalsData.php
class QuoteTotalsData extends Data
{
    public function __construct(
        public readonly float $subtotal,
        public readonly float $discountPercentage,
        public readonly float $discountAmount,
        public readonly float $taxAmount,
        public readonly float $totalAmount,
        public readonly float $depositAmount,
        /** @var array<int, array{id: int, subtotal: float, discount_amount: float, total: float, vat_amount: float, total_with_vat: float}> */
        public readonly array $itemTotals,
        /** @var array<int, array{id: int, amount: float}> */
        public readonly array $depositAmounts,
    ) {}
}
```

#### 2. Il Domain Service — calcolo puro

```php
// app/Domains/Quote/Services/QuoteTotalsCalculatorService.php
//
// Riceve dati già caricati, restituisce valori calcolati.
// Zero DB, zero side-effects — testabile con dati in memoria.

class QuoteTotalsCalculatorService
{
    public function calculate(Collection $parentItems, Quote $quote, Collection $deposits): QuoteTotalsData
    {
        // Ricalcola i totali degli item padre aggregando i figli
        $itemTotals = $parentItems
            ->filter(fn($item) => $item->children->count() > 0)
            ->map(fn($item) => [
                'id'             => $item->id,
                'subtotal'       => (float) $item->children->sum('subtotal'),
                'discount_amount'=> (float) $item->children->sum('discount_amount'),
                'total'          => (float) $item->children->sum('total'),
                'vat_amount'     => (float) $item->children->sum('vat_amount'),
                'total_with_vat' => (float) $item->children->sum('total_with_vat'),
            ])
            ->values()
            ->all();

        // Subtotale da tutti gli item padre (già aggiornati in memoria sopra)
        $subtotal = (float) $parentItems->sum('subtotal');

        // Sconto: discount_amount è source of truth se presente
        if ($subtotal > 0 && $quote->discount_amount > 0) {
            $discountAmount     = (float) $quote->discount_amount;
            $discountPercentage = round(($discountAmount / $subtotal) * 100, 4);
        } else {
            $discountPercentage = (float) $quote->discount_percentage;
            $discountAmount     = round(($subtotal * $discountPercentage) / 100, 2);
        }

        $totalImponibile = $subtotal - $discountAmount;
        $rawVat          = (float) $parentItems->sum('vat_amount');
        $discountFactor  = $subtotal > 0 ? ($totalImponibile / $subtotal) : 1;
        $taxAmount       = round($rawVat * $discountFactor, 2);
        $totalAmount     = $totalImponibile + $taxAmount;

        $depositAmount = $quote->deposit_percentage > 0
            ? round(($totalAmount * $quote->deposit_percentage) / 100, 2)
            : 0.0;

        return new QuoteTotalsData(
            subtotal:           $subtotal,
            discountPercentage: $discountPercentage,
            discountAmount:     $discountAmount,
            taxAmount:          $taxAmount,
            totalAmount:        $totalAmount,
            depositAmount:      $depositAmount,
            itemTotals:         $itemTotals,
            depositAmounts:     $this->calculateDepositAmounts($deposits, $totalAmount),
        );
    }

    private function calculateDepositAmounts(Collection $deposits, float $totalAmount): array
    {
        if ($deposits->isEmpty()) {
            return [];
        }

        $isFullSchedule = abs($deposits->sum('percentage') - 100) < 0.01;
        $runningSum     = 0.0;
        $lastIndex      = $deposits->count() - 1;

        return $deposits
            ->map(function ($deposit, $i) use ($totalAmount, $isFullSchedule, $lastIndex, &$runningSum) {
                if ($isFullSchedule && $i === $lastIndex) {
                    $amount = round($totalAmount - $runningSum, 2);
                } else {
                    $amount      = round(($totalAmount * $deposit->percentage) / 100, 2);
                    $runningSum += $amount;
                }

                return ['id' => $deposit->id, 'amount' => $amount];
            })
            ->values()
            ->all();
    }
}
```

#### 3. L'Action — carica, delega, persiste

```php
// app/Domains/Quote/Actions/RecalculateQuoteTotalsAction.php

class RecalculateQuoteTotalsAction
{
    public function __construct(
        private readonly QuoteTotalsCalculatorService $calculator,
    ) {}

    public function execute(Quote $quote): Quote
    {
        return DB::transaction(function () use ($quote) {
            // 1. Carica i dati necessari (responsabilità dell'Action)
            $parentItems = $quote->items()
                ->whereNull('parent_id')
                ->with('children')
                ->get();

            $deposits = $quote->deposits()
                ->where('is_fixed_amount', false)
                ->whereNotNull('percentage')
                ->orderBy('sort_order')
                ->get();

            // 2. Calcola (responsabilità del Domain Service)
            $totals = $this->calculator->calculate($parentItems, $quote, $deposits);

            // 3. Persiste i risultati (responsabilità dell'Action)
            foreach ($totals->itemTotals as $row) {
                $parentItems->find($row['id'])?->fill([
                    'subtotal'        => $row['subtotal'],
                    'discount_amount' => $row['discount_amount'],
                    'total'           => $row['total'],
                    'vat_amount'      => $row['vat_amount'],
                    'total_with_vat'  => $row['total_with_vat'],
                ])->saveQuietly();
            }

            $quote->fill([
                'subtotal'            => $totals->subtotal,
                'discount_percentage' => $totals->discountPercentage,
                'discount_amount'     => $totals->discountAmount,
                'tax_amount'          => $totals->taxAmount,
                'total_amount'        => $totals->totalAmount,
                'deposit_amount'      => $totals->depositAmount,
            ])->saveQuietly();

            foreach ($totals->depositAmounts as $row) {
                $deposits->find($row['id'])?->fill(['amount' => $row['amount']])->saveQuietly();
            }

            return $quote->refresh();
        });
    }
}
```

#### Perché questa separazione è corretta

```
QuoteTotalsCalculatorService::calculate()
  → riceve Collection già caricate + Quote
  → restituisce QuoteTotalsData
  → ZERO query, testabile con dati fake senza toccare il DB

RecalculateQuoteTotalsAction::execute()
  → carica i dati dal DB
  → chiama il Service per i calcoli
  → persiste i risultati
  → dispatcha eventi se necessario
```

Il Domain Service diventa testabile in isolamento assoluto:

```php
// Test pulito, zero DB
it('calcola lo sconto correttamente', function () {
    $items    = collect([fakeItem(subtotal: 1000, vat_amount: 220)]);
    $deposits = collect();
    $quote    = fakeQuote(discount_amount: 100, deposit_percentage: 0);

    $result = app(QuoteTotalsCalculatorService::class)
        ->calculate($items, $quote, $deposits);

    expect($result->discountPercentage)->toBe(10.0)
        ->and($result->totalAmount)->toBe(990.0 + round(220 * 0.9, 2));
});
```

### ConvertQuoteToProject è un Application Service

`convertToProject()` **scrive su due domini**: crea un `Project` (dominio Project) e aggiorna la `Quote` (dominio Quote). È quindi un **Application Service**, non una Domain Action.

```
Tocca 1 solo dominio  →  Domain Action in Domains/{Domain}/Actions/
Tocca 2+ domini       →  ApplicationServices/
```

```php
// app/ApplicationServices/Quote/ConvertQuoteToProjectService.php
class ConvertQuoteToProjectService
{
    public function __construct(
        private readonly CreateProjectFromQuoteAction $createProject,
    ) {}

    public function execute(Quote $quote): Project
    {
        if ($quote->status !== 'approved') {
            throw new \DomainException('Solo i preventivi approvati possono essere convertiti.');
        }

        return DB::transaction(function () use ($quote) {
            // Domain Action — crea Project nel dominio Project
            $project = $this->createProject->execute($quote);

            // Aggiorna Quote nello stesso dominio
            $quote->project_id = $project->id;
            $quote->status     = 'converted';
            $quote->save();

            QuoteConvertedToProject::dispatch($quote, $project, [
                'converted_by' => auth()->id(),
                'converted_at' => now(),
            ]);

            return $project;
        });
    }
}

// app/Domains/Project/Actions/CreateProjectFromQuoteAction.php
class CreateProjectFromQuoteAction
{
    public function execute(Quote $quote): Project
    {
        $project = Project::create([
            'code'                => app(CodeGeneratorService::class)->generate('project'),
            'name'                => $quote->title,
            'customer_id'         => $quote->customer_id,
            'project_manager_id'  => $quote->project_manager_id,
            'description'         => $quote->description,
            'address'             => $quote->address,
            'city'                => $quote->city,
            'province'            => $quote->province,
            'postal_code'         => $quote->postal_code,
            'start_date'          => $quote->work_start_date?->format('Y-m-d'),
            'estimated_end_date'  => $quote->work_end_date?->format('Y-m-d'),
            'quote_id'            => $quote->id,
            'status'              => 'planned',
            'estimated_amount'    => $quote->total_amount,
            'is_active'           => true,
        ]);

        $this->createMaterials($quote, $project);

        return $project;
    }

    private function createMaterials(Quote $quote, Project $project): void
    {
        $quote->items()
            ->whereIn('type', [QuoteItemType::Item->value])
            ->whereNotNull('product_id')
            ->where('quantity', '>', 0)
            ->get()
            ->each(function ($item) use ($quote, $project) {
                $unitPrice = (float) ($item->unit_price ?? 0);

                if ($quote->vat_included_in_prices && $item->vat_rate > 0) {
                    $unitPrice = $unitPrice / (1 + ($item->vat_rate / 100));
                }

                ProjectMaterial::create([
                    'project_id'        => $project->id,
                    'product_id'        => $item->product_id,
                    'quote_item_id'     => $item->id,
                    'planned_quantity'  => $item->quantity,
                    'planned_unit_cost' => round($unitPrice, 4),
                    'actual_unit_cost'  => round($unitPrice, 4),
                    'is_extra'          => false,
                    'status'            => 'planned',
                    'notes'             => $item->notes,
                    'is_rental'         => in_array($item->billing_unit?->value, ['day', 'hour', 'week', 'month']),
                ]);
            });
    }
}
```

### booted() → CreateQuoteAction

```php
// ❌ PRIMA — nel modello
protected static function booted(): void
{
    static::creating(function ($quote) {
        if (empty($quote->code)) {
            $quote->code = app(CodeGeneratorService::class)->generate('quote');
        }
    });
}

// ✅ DOPO — nella Action
class CreateQuoteAction
{
    public function execute(QuoteData $data): Quote
    {
        return DB::transaction(function () use ($data) {
            $quote = Quote::create([
                ...$data->except('id')->toArray(),
                'code' => app(CodeGeneratorService::class)->generate('quote', [
                    'year' => now()->year,
                ]),
            ]);

            QuoteCreated::dispatch($quote, ['created_by' => auth()->id()]);

            return $quote;
        });
    }
}
```

### Riepilogo del refactoring Quote

| Cosa | Dove era | Dove va |
|---|---|---|
| `calculateTotals()` | Model | calcolo → `QuoteTotalsCalculatorService`, persistenza → `RecalculateQuoteTotalsAction` |
| `approve/reject/send()` con `update()` | Model | Model (solo proprietà) + `ApproveQuoteAction` |
| `convertToProject()` | Model | `ConvertQuoteToProjectService` (Application Service) |
| `createProjectProducts()` | Model | `CreateProjectFromQuoteAction` (dominio Project) |
| `booted()` + codice | Model | `CreateQuoteAction` |
| Predicati (`canBe*`, `is*`) | Model ✅ | Restano nel Model |
| Attributi computati | Model ✅ | Restano nel Model |
| Relazioni | Model ✅ | Restano nel Model |
| Scope | Model ✅ | Restano nel Model |

---

## Riepilogo rapido (cheat sheet)

| Cosa | Dove | Namespace |
|------|------|-----------|
| Calcolo su 1 aggregato | Metodo sul Model | `App\Domains\Quote\Models\Quote` |
| Transizione di stato | Metodo sul Model (solo proprietà, no save) | `App\Domains\Quote\Models\Quote` |
| Concetto di dominio | Value Object | `App\ValueObjects\Money` |
| Calcolo cross-aggregato (no DB) | Domain Service | `App\Domains\Quote\Services\` |
| Scrittura 1 aggregato | Action | `App\Domains\Quote\Actions\` |
| Lettura complessa | Query Class | `App\Domains\Quote\Queries\` |
| Use case cross-dominio | Application Service | `App\ApplicationServices\Quote\` |
| Servizio usato da più domini | Shared Service | `App\Domains\Shared\Services\` |
| Enum di stato dominio | Enum nel dominio | `App\Domains\Quote\Enums\` |
| Enum cross-dominio | Enum in Shared | `App\Domains\Shared\Enums\` |
| Job, Mail, Notification domain | Sottocartella dominio | `App\Domains\Quote\Jobs\` |
| Job, Mail, Notification cross-dominio | Shared | `App\Domains\Shared\Jobs\` |
| Eccezione di business | Exceptions nel dominio | `App\Domains\Quote\Exceptions\` |
| Repository + Interface | ❌ Non usare | Eloquent IS the repository |
| Adapter HTTP | Controller | `App\Http\Controllers\Api\V1\` |
| Middleware, Provider, Command | Flat Laravel standard | `App\Http\Middleware\` ecc. |

---

**Versione**: 1.1
**Basata su**: conversazioni DDD aprile 2026
**Aggiornamenti v1.1**: sezioni 14 (elementi supporto), 15 (repository pattern), 16 (refactoring Quote)
**Progetto**: DGGM ERP — Laravel 12 + PHP 8.3
