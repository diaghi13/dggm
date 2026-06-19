# Inventory & Reservation Architecture

**Status**: Design decisions locked — implementazione in corso
**Sessione**: Maggio 2026
**Autore**: Davide Donghi

---

## Contesto

Durante una sessione di design per l'endpoint `stock-movements/rental-out`, abbiamo rivalutato l'intera architettura delle quantità di magazzino. Il punto di partenza era il campo `quantity_out_on_rental` posizionato sulla tabella `products` — dominio sbagliato, semantica ambigua.

---

## 1. Problema: `quantity_out_on_rental` sul dominio Products

### Situazione precedente

```
products.quantity_out_on_rental  ← campo globale, cross-warehouse, dominio sbagliato
```

**Perché era sbagliato:**

1. **Dominio errato** — il tracciamento dello stock appartiene al dominio Warehouse (`inventory`), non al dominio Product. Il model `Product` non dovrebbe sapere quante unità sono fisicamente fuori a noleggio.
2. **Perdita di granularità** — un singolo intero aggregato su tutto il prodotto impedisce di sapere da quale magazzino sono uscite le unità.
3. **Incoerenza con gli altri campi** — `total_stock` e `total_reserved` erano già calcolati sommando su `inventory` per warehouse. `quantity_out_on_rental` era un'eccezione piatta che rompeva la coerenza.
4. **Formula `available_stock` inconsistente** — il Product model calcolava:
   ```php
   $this->total_stock - $this->total_reserved - $this->quantity_out_on_rental
   ```
   Ma `total_stock` somma `inventory.quantity_available`. Se le unità noleggiate escono già da `quantity_available`, la sottrazione è un doppio conteggio.

### Soluzione

Il campo è stato spostato su `inventory` tramite migration:

```
database/migrations/tenant/2026_05_06_014832_add_quantity_out_on_rental_to_inventory_table.php
```

Il totale per prodotto si calcola — come già `total_stock` e `total_reserved` — sommando su tutti i warehouse:

```php
// Product model
protected function totalOutOnRental(): Attribute
{
    return Attribute::make(
        get: fn () => (float) $this->inventory()->sum('quantity_out_on_rental')
    );
}
```

---

## 2. Semantica delle colonne `inventory` (Modello B — Flotta)

### Valutazione dei due modelli

**Modello A — "Presenza fisica"**: `quantity_available` diminuisce quando le unità escono per noleggio.

**Modello B — "Flotta posseduta"**: `quantity_available` rappresenta la flotta totale. Non cambia per il noleggio.

### Scelta: Modello B

Per un'azienda di noleggio, il concetto corretto è la **flotta**, non la presenza fisica. Hai 10 generatori: li possiedi indipendentemente da dove si trovano. Quando ne noleggi 3, ne possiedi ancora 10 — ne hai 3 fuori e 7 in magazzino.

### Semantica delle colonne

| Colonna | Significato | Cambia quando |
|---------|-------------|---------------|
| `quantity_available` | Flotta totale posseduta | Acquisto, vendita, scarto |
| `quantity_reserved` | Bloccato per prenotazioni future confermate | → vedere sezione 4 |
| `quantity_out_on_rental` | Fisicamente presso clienti in noleggio attivo | RENTAL_OUT / RENTAL_RETURN |
| `quantity_in_transit` | In trasferimento tra magazzini | TRANSFER avviato / completato |
| `quantity_quarantine` | In riparazione / danneggiato | Ispezione → quarantena / rilascio |

### Formula disponibilità

```
Liberi per nuovi noleggi/vendite =
    quantity_available
    - quantity_reserved          (bloccati da prenotazioni confermate)
    - quantity_out_on_rental     (fisicamente fuori)
    - quantity_in_transit        (in movimento)
    - quantity_quarantine        (non utilizzabili)
```

### Comportamento per tipo di movimento

| Movimento | quantity_available | quantity_out_on_rental | Note |
|-----------|-------------------|-----------------------|------|
| INTAKE | +x | — | Acquisto nuove unità |
| OUTPUT | -x | — | Vendita / uscita permanente |
| WASTE | -x | — | Scarto — uscita permanente |
| RENTAL_OUT | — | +x | Noleggio: la flotta non cambia |
| RENTAL_RETURN | — | -x | Rientro da noleggio |
| SITE_ALLOCATION | -x | — | Materiale consumato in cantiere |
| SITE_RETURN | +x | — | Rientro materiale non consumato |
| KIT_ASSEMBLY | -x (componenti) | — | Componenti scalati |
| KIT_DISASSEMBLY | +x (componenti) | — | Componenti ripristinati |

**Distinzione chiave**: RENTAL (temporaneo, torna) → `out_on_rental`. SITE_ALLOCATION (consumato) → `quantity_available`.

---

## 3. `ProjectAvailabilityCheck` — Analisi dominio

### Valutazione

Le tabelle `project_availability_checks` e `project_availability_check_items` sono state valutate come potenzialmente over-engineered o fuori dominio.

**Conclusione: il concetto è corretto e il dominio è giusto.**

Motivazioni:
- Non è una query di magazzino — è un **artefatto di workflow** del Project Manager
- Le risoluzioni (`reserve_existing`, `subrental`, `remove_from_project`) sono decisioni di progetto, non di magazzino
- Ha valore come storico: "il 5 maggio 2026 abbiamo verificato la disponibilità e avevamo shortage su 2 materiali"
- Il dominio Project è corretto perché la domanda è "posso soddisfare questo cantiere?" — non "quanto stock ho?"

### Difetto attuale

Il check è **date-blind**: verifica disponibilità "adesso" senza considerare quando il cantiere parte. Due cantieri che si sovrappongono nel tempo possono entrambi passare il check anche se non possono essere soddisfatti contemporaneamente.

**Fix**: Il check dovrà interrogare `inventory_reservations` per range di date invece del contatore piatto. La risoluzione `reserve_existing` creerà una riga in `inventory_reservations`.

---

## 4. `inventory_reservations` — Nuova tabella

### Problema risolto

`quantity_reserved` come semplice contatore è troppo blunt:
- Confermi un noleggio per tra un mese → blocchi subito le unità
- Quelle unità potrebbero essere noleggiate questa settimana e tornare in tempo
- Perdi utilizzo di flotta

### Soluzione: prenotazioni con date

Una riga per ogni impegno futuro, con date di inizio e fine.

```
inventory_reservations
──────────────────────────────────────────────────────────────────
id | product_id | warehouse_id | quantity | start_date | end_date
   | type       | reference_type | reference_id | status | notes
──────────────────────────────────────────────────────────────────
1  | 42 | 1 | 2 | 2026-06-01 | 2026-06-30 | rental_booking   | Ddt#5    | confirmed
2  | 42 | 1 | 3 | 2026-05-10 | null       | project_material | Project#8| active
3  | 42 | 1 | 1 | 2026-05-20 | 2026-05-25 | rental_booking   | Ddt#6    | confirmed
```

### Disponibilità per data

```sql
-- Quante unità di prodotto X sono libere dal 15/05 al 20/05?
libere = quantity_available
       - quantity_out_on_rental     -- già fuori fisicamente
       - SUM(
           quantity
           FROM inventory_reservations
           WHERE product_id = X
             AND status IN ('confirmed', 'active')
             AND start_date <= '2026-05-20'
             AND (end_date IS NULL OR end_date >= '2026-05-15')
         )
```

### Schema della tabella

```php
Schema::create('inventory_reservations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
    $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
    $table->decimal('quantity', 10, 2);
    $table->date('start_date');
    $table->date('end_date')->nullable();          // null = open-ended
    $table->string('type');                        // enum: InventoryReservationType
    $table->nullableMorphs('reference');           // reference_type + reference_id (Project, Ddt, ...)
    $table->string('status');                      // enum: InventoryReservationStatus
    $table->text('notes')->nullable();
    $table->timestamps();

    $table->index(['product_id', 'warehouse_id', 'start_date', 'end_date']);
    $table->index(['status', 'start_date']);
});
```

**`warehouse_id` nullable**: permette prenotazioni product-wide quando il magazzino di evasione non è ancora noto.

**`nullableMorphs('reference')`**: `reference_type` (es. `App\Domains\Project\Models\Project`) + `reference_id` (int). Permette di collegare la prenotazione a qualsiasi entità.

**`end_date` nullable**: per prenotazioni open-ended (cantiere senza data fine, noleggio a lungo termine).

### Enum `InventoryReservationType`

```php
enum InventoryReservationType: string
{
    case RentalBooking    = 'rental_booking';     // DDT noleggio futuro
    case ProjectMaterial  = 'project_material';   // Materiale pianificato per cantiere
    case SaleOrder        = 'sale_order';          // Ordine vendita confermato
}
```

### Enum `InventoryReservationStatus`

```php
enum InventoryReservationStatus: string
{
    case Pending   = 'pending';    // Creata, non confermata — NON blocca disponibilità
    case Confirmed = 'confirmed';  // Confermata — BLOCCA disponibilità
    case Active    = 'active';     // In corso (DDT emesso / cantiere avviato) — BLOCCA
    case Completed = 'completed';  // Conclusa — non blocca
    case Cancelled = 'cancelled';  // Annullata — non blocca

    public function blocksAvailability(): bool
    {
        return in_array($this, [self::Confirmed, self::Active]);
    }
}
```

Solo `confirmed` e `active` entrano nel calcolo della disponibilità.

### Ciclo di vita di una prenotazione

```
Preventivo accettato    → pending
Cantiere confermato     → confirmed   (inizia a bloccare disponibilità)
DDT emesso / partenza   → active      (rimane bloccato)
Materiale restituito    → completed   (libera disponibilità)
Cantiere annullato      → cancelled   (libera disponibilità)
```

---

## 5. File creati/modificati

### Sessione 1 (2026-05-07) — Foundation

| File | Tipo | Scopo |
|------|------|-------|
| `migrations/tenant/2026_05_06_..._add_quantity_out_on_rental_to_inventory_table.php` | Migration | Aggiunge colonna a `inventory` |
| `migrations/tenant/2026_05_07_..._create_inventory_reservations_table.php` | Migration | Crea tabella `inventory_reservations` |
| `app/Enums/InventoryReservationType.php` | Enum | Tipi di prenotazione |
| `app/Enums/InventoryReservationStatus.php` | Enum | Stati con `blocksAvailability()` |
| `app/Domains/Warehouse/Models/InventoryReservation.php` | Model | Con scopes `active()`, `overlappingDates()` |
| `app/Domains/Warehouse/Data/InventoryReservationData.php` | DTO | Input/output Spatie Data + TypeScript |

### Sessione 2 (2026-05-07) — Actions, Queries, Controller

| File | Tipo | Scopo |
|------|------|-------|
| `app/Domains/Warehouse/Queries/Inventory/GetAvailableQuantityForDateRangeQuery.php` | Query | Disponibilità per date range (cuore del sistema) |
| `app/Domains/Warehouse/Actions/Inventory/CreateInventoryReservationAction.php` | Action | Crea prenotazione con validazione disponibilità |
| `app/Domains/Warehouse/Actions/Inventory/CancelInventoryReservationAction.php` | Action | Cancella prenotazione (stati terminali bloccati) |
| `app/Domains/Warehouse/Actions/Inventory/TransferInventoryAction.php` | Action | Trasferimento atomico tra due warehouse |
| `app/Domains/Warehouse/Actions/StockMovement/RentalOutAction.php` | Action | RENTAL_OUT — Modello B: solo `quantity_out_on_rental` sale |
| `app/Domains/Warehouse/Actions/StockMovement/RentalReturnAction.php` | Action | RENTAL_RETURN — Modello B: solo `quantity_out_on_rental` scende |
| `app/Domains/Warehouse/Actions/Inventory/AdjustInventoryAction.php` | Action | Aggiunto parametro `?int $projectId` |
| `app/Http/Controllers/Api/V1/Warehouses/StockMovementController.php` | Controller | Aggiunti 6 metodi: output, transfer, rentalOut, rentalReturn, deliverToProject, returnFromProject |
| `app/Listeners/GenerateStockMovementsListener.php` | Listener | Fix critico: processRentalOut/Return ora usa Modello B su `inventory` invece di `products` |
| ~~`app/Http/Resources/StockMovementResource.php`~~ | Eliminato | Deprecato — attributi errati (`material_id`), non usato |

---

## 6. TODO — Implementazione ancora da fare

### Priorità alta

- [x] **Aggiornare `Product` model** — rimosso `quantity_out_on_rental` da `$fillable`, aggiunto `totalOutOnRental()` computed, `availableStock()` usa `total_out_on_rental`, rimossi `rentOut/rentReturn()`
- [x] **Aggiornare `ProductData`** — rimosso `quantity_out_on_rental` dal costruttore, aggiunto `total_out_on_rental` come `#[Computed]`
- [x] **Rimuovere `quantity_out_on_rental` da `products`** — migration `dropColumn` creata in `tenant/`, model e DTO aggiornati
- [x] **Cleanup** — `ProductController`, `ImportController`, `ImportSupplierCatalogAction`, `ProductResource`, `GetRentalKpiQuery`, `ReverseStockMovementsListener`, frontend `types/index.ts` e `products/[id]/page.tsx` tutti aggiornati
- [x] **Migrazione dati** — distribuzione proporzionale per warehouse (quota `quantity_available`) nel `up()` della drop migration, prima del `dropColumn`

### Priorità media

- [x] **Aggiornare `RunProjectAvailabilityCheckAction`** — usa `GetAvailableQuantityForDateRangeQuery` con `project.start_date` / `project.estimated_end_date`; fallback `now()` se cantiere senza data inizio
- [x] **`ResolveAvailabilityItemAction`** — `reserve_existing` ora crea riga in `inventory_reservations` (tipo `project_material`, status `confirmed`, reference → Project) tramite `CreateInventoryReservationAction`

### Pulizia

- [x] **`quantity_reserved` in `inventory`** — mantenuto con semantica definita (vedi §7.1)
- [x] **Refactor `GenerateStockMovementsListener`** — ✅ COMPLETATO: listener ridotto a dispatcher puro (7 azioni dedicate per tipo DDT + `ExplodeBomComponentsAction` estratta). Copertura test: 20 Pest tests in `tests/Feature/Warehouse/GenerateStockMovementsListenerTest.php`.

---

## 7. Decisioni

1. **`quantity_reserved` su `inventory`** — ✅ RISOLTO: si mantiene. Semantica: materiale fisicamente acquistato e segregato in magazzino per un cantiere specifico in attesa dell'inizio lavori, destinato all'uscita come vendita (SITE_ALLOCATION). Non viene toccato da `inventory_reservations`, che gestisce prenotazioni date-aware su stock esistente non ancora allocato fisicamente.

2. **Migrazione dati `quantity_out_on_rental`** — ✅ RISOLTO: distribuzione proporzionale per warehouse in base a `quantity_available`. Chi ha più stock assorbe più unità noleggiate. L'ultimo warehouse riceve il resto per evitare drift da arrotondamento.

3. **Refactor `GenerateStockMovementsListener`** — ✅ COMPLETATO: estratte 7 azioni per tipo DDT (`ProcessIncomingDdtAction`, `ProcessOutgoingDdtAction`, `ProcessInternalDdtAction`, `ProcessRentalOutDdtAction`, `ProcessRentalReturnDdtAction`, `ProcessReturnFromCustomerDdtAction`, `ProcessReturnToSupplierDdtAction`) + `ExplodeBomComponentsAction` (dispatcha `StockMovementCreated` anche per i componenti — bug fix). 20 test Pest coprono tutti i tipi DDT + BOM explosion + Modello B Noleggio.

---

**Ultima modifica**: 2026-05-07 (implementazione completata)
