# 🎯 Warehouse Module - Analisi Finale e Piano di Implementazione

**Data Analisi**: 23 Gennaio 2026  
**Strategia Confermata**: Backend → Testing → Frontend  
**Tempo Stimato**: 32-44 ore (5 giorni full-time o 2 settimane part-time)  
**Status**: ✅ Analisi Completata - Pronto per Implementazione

---

## 📊 RIEPILOGO ESECUTIVO

### Cosa Abbiamo Scoperto
Il modulo Warehouse/Inventory/DDT ha una struttura esistente MA è **ROTTO** dopo il refactor Material → Product e **VIOLA** le regole architetturali del progetto.

**Problemi Critici** (14 trovati):
1. ❌ `StockMovement` e `DdtItem` usano ancora `material_id` invece di `product_id`
2. ❌ Nessun Spatie Data DTO (richiesto dall'architettura)
3. ❌ Nessuna Action (richiesto dall'architettura)
4. ❌ Services con operazioni database (dovrebbero essere in Actions)
5. ❌ Nessuna Query Class (dovrebbero gestire le letture complesse)
6. ❌ Nessuna architettura event-driven (moduli accoppiati)
7. ❌ Frontend completamente assente

### Cosa Dobbiamo Fare
**Refactor completo** del modulo seguendo l'architettura corretta del progetto con pattern event-driven.

---

## ✅ DECISIONI CONFERMATE

### 1. Strategia di Implementazione
**Backend → Testing → Frontend** (Strategia B)
- Completiamo tutto il backend (Fasi 1-7)
- Testiamo il backend a fondo (Fase 8)
- Poi implementiamo il frontend (Fasi 9-10)

**Perché**: Backend deve essere solido prima di costruire UI sopra.

### 2. Regole DDT Edit
**DDT NON modificabile dopo conferma**
- ✅ Modificabile: Solo stato **Draft**
- ❌ NON Modificabile: Issued, In Transit, Delivered, Cancelled
- ❌ Immutabili Sempre: Type, Warehouses (anche in Draft)

**Motivo**: Una volta confermato, il DDT ha generato movimenti di stock. Modificarlo richiederebbe stornare e ricreare tutto → troppo complesso e rischioso.

### 3. Architettura Event-Driven
**TUTTI i moduli comunicano via Eventi + Listeners**

**Esempio Pratico - Conferma DDT**:
```
Utente clicca "Conferma DDT"
  ↓
Controller chiama ConfirmDdtAction
  ↓
ConfirmDdtAction:
  - Valida stock disponibile
  - Cambia status → Issued
  - 🔔 Dispatch DdtConfirmed event
    ↓
GenerateStockMovementsListener ascolta DdtConfirmed:
  - Crea movimenti stock per ogni item
  - Aggiorna inventory
  - 🔔 Dispatch StockMovementCreated events
    ↓
CheckLowStockAfterMovementListener ascolta StockMovementCreated:
  - Controlla se stock sotto minimo
  - 🔔 Dispatch InventoryLowStock event se necessario
    ↓
SendLowStockAlertListener ascolta InventoryLowStock:
  - Invia email/notifica al responsabile magazzino
```

**Vantaggi**:
- ✅ Moduli **disaccoppiati** (Inventory non sa di DDT, DDT non sa di StockMovement)
- ✅ Facile **estendere** (aggiungi listener senza toccare Actions)
- ✅ **Testabile** (testa Actions e Listeners separatamente)
- ✅ **Audit trail automatico** (tutti gli eventi loggati)

### 4. Query Classes per Letture
**TUTTE le letture complesse vanno in Query Classes**
- Location: `app/Queries/Inventory/`, `app/Queries/StockMovement/`, `app/Queries/Ddt/`
- Pattern: Classe readonly con metodo `execute()`
- Naming: `GetInventoryQuery`, `GetLowStockItemsQuery`, etc.

**Esempio**:
```php
readonly class GetLowStockItemsQuery
{
    public function __construct(
        private ?int $warehouseId = null
    ) {}

    public function execute(): Collection
    {
        return Inventory::query()
            ->whereRaw('quantity_available <= minimum_stock')
            ->with(['product', 'warehouse'])
            ->when($this->warehouseId, fn($q) => $q->where('warehouse_id', $this->warehouseId))
            ->get();
    }
}

// Uso nel Controller:
$items = (new GetLowStockItemsQuery($warehouseId))->execute();
```

**Perché**: Services diventavano troppo grandi con query complesse. Query Classes sono riusabili, testabili, e mantengono Services puliti.

### 5. Eventi da Implementare
**10 Eventi totali** per audit trail completo:

**Inventory** (4 eventi):
- `InventoryAdjusted` - Stock modificato manualmente
- `InventoryLowStock` - Stock sotto minimo (già esiste, potenziare)
- `InventoryReserved` - Stock riservato per cantiere/ordine
- `InventoryReservationReleased` - Riserva cancellata

**StockMovement** (2 eventi):
- `StockMovementCreated` - Movimento registrato
- `StockMovementReversed` - Movimento stornato/corretto

**DDT** (4 eventi):
- `DdtCreated` - DDT creato (Draft)
- `DdtUpdated` - DDT modificato (solo Draft)
- `DdtConfirmed` - DDT confermato → **genera movimenti stock**
- `DdtCancelled` - DDT annullato → **storna movimenti stock**
- `DdtDelivered` - DDT consegnato → **aggiorna site_materials**
- `DdtDeleted` - DDT eliminato (soft delete)

---

## 📋 PIANO 10 FASI

### **FASE 1: Fix Backend Models** (2-3h) 🔴 CRITICA
**Problema**: StockMovement e DdtItem usano ancora Material invece di Product

**Task**:
1. ✏️ Apri `app/Models/StockMovement.php`
   - Cambia `'material_id'` → `'product_id'` in fillable
   - Cambia `material()` → `product()` relationship
   - Cambia `Material::class` → `Product::class`
2. ✏️ Apri `app/Models/DdtItem.php`
   - Stessi cambi di sopra
3. ✅ Verifica `Inventory.php` - dovrebbe già essere OK
4. ✅ Verifica `Ddt.php` - dovrebbe già essere OK

**Deliverable**: 4 models aggiornati e funzionanti con Product

---

### **FASE 2: Spatie Data DTOs** (3-4h) 🔴 CRITICA
**Problema**: Nessun DTO (violazione architettura)

**Task**:
1. 📝 Crea `app/Data/InventoryData.php` (~200 righe)
   - Validazione input (Required, Exists, Min)
   - Lazy relationships (product, warehouse)
   - Computed properties (quantity_free, is_low_stock, stock_value)
2. 📝 Crea `app/Data/StockMovementData.php` (~220 righe)
   - Gestione enums (StockMovementType)
   - Lazy relationships (product, warehouse, from/to, site, supplier, user, ddt)
3. 📝 Crea `app/Data/DdtItemData.php` (~100 righe)
   - Computed total_cost
4. 📝 Crea `app/Data/DdtData.php` (~280 righe)
   - DataCollection per items e stock_movements
   - Gestione enums (DdtType, DdtStatus, ReturnReason)
5. ⚙️ Run `php artisan typescript:transform`
6. ✅ Verifica TS types in `resources/types/generated.d.ts`

**Deliverable**: 4 DTOs + TypeScript types generati

---

### **FASE 3: Events & Listeners** (5-6h) 🔴 CRITICA - **LA PIÙ IMPORTANTE**
**Problema**: Nessuna architettura event-driven, moduli accoppiati

**Events da Creare** (10):
1. `InventoryAdjusted`
2. `InventoryReserved`
3. `InventoryReservationReleased`
4. `StockMovementCreated`
5. `StockMovementReversed`
6. `DdtCreated`
7. `DdtUpdated`
8. `DdtConfirmed` 🔥
9. `DdtCancelled` 🔥
10. `DdtDelivered` 🔥
11. `DdtDeleted`

**Listeners da Creare** (10):
1. `LogInventoryAdjustmentListener` - Audit trail
2. `LogInventoryReservationListener` - Audit trail
3. `CheckLowStockAfterMovementListener` - Controlla stock basso
4. `LogStockMovementListener` - Audit trail
5. **`GenerateStockMovementsListener`** 🔥🔥🔥 (~400 righe) - **IL PIÙ CRITICO**
   - Ascolta `DdtConfirmed`
   - Crea movimenti stock basati su tipo DDT
   - Contiene tutta la business logic (processIncoming, processOutgoing, etc.)
6. **`ReverseStockMovementsListener`** 🔥🔥 (~200 righe) - **CRITICO**
   - Ascolta `DdtCancelled`
   - Storna tutti i movimenti del DDT
7. **`UpdateSiteMaterialsListener`** 🔥🔥 (~100 righe) - **CRITICO**
   - Ascolta `DdtDelivered`
   - Aggiorna tabella `site_materials` per DDT outgoing a cantieri
8. `NotifyWarehouseManagerListener` - Notifiche
9. `LogDdtActivityListener` - Audit trail
10. Verifica `SendLowStockAlertListener` (già esiste)

**Task Speciale**:
- 🔄 Sposta logica da `DdtService::processIncoming()`, `processOutgoing()`, etc. → `GenerateStockMovementsListener`
- ⚙️ Registra tutto in `EventServiceProvider`

**Deliverable**: Architettura event-driven funzionante, moduli disaccoppiati

---

### **FASE 4: Query Classes** (3-4h) 🔴 CRITICA
**Problema**: Query complesse nei Services

**Query Classes da Creare** (12):

**Inventory** (5):
1. `GetInventoryQuery` - Lista inventory con filtri
2. `GetLowStockItemsQuery` - Prodotti sotto minimo
3. `GetInventoryByWarehouseQuery` - Inventory per magazzino
4. `GetInventoryByProductQuery` - Inventory per prodotto
5. `GetStockValuationQuery` - Valore totale stock

**StockMovement** (3):
6. `GetStockMovementsQuery` - Lista movimenti con filtri + pagination
7. `GetMovementHistoryByProductQuery` - Storico per prodotto
8. `GetRentalHistoryQuery` - Storico noleggi

**DDT** (4):
9. `GetDdtsQuery` - Lista DDT con filtri + pagination
10. `GetDdtByIdQuery` - DDT singolo con relazioni
11. `GetActiveDdtsBySiteQuery` - DDT attivi per cantiere
12. `GetPendingRentalReturnsQuery` - Noleggi da rientrare

**Deliverable**: 12 Query Classes, Services puliti dalle query

---

### **FASE 5: Actions Pattern** (6-8h) 🔴 CRITICA
**Problema**: Nessuna Action, business logic nei Services

**Actions da Creare** (10):

**Inventory** (3):
1. `AdjustInventoryAction` - Aggiusta stock manualmente
   - Dispatcha `InventoryAdjusted` + `InventoryLowStock` (se necessario)
2. `ReserveInventoryAction` - Riserva stock
   - Dispatcha `InventoryReserved`
3. `ReleaseInventoryReservationAction` - Rilascia riserva
   - Dispatcha `InventoryReservationReleased`

**StockMovement** (1):
4. `ReverseStockMovementAction` - Storna movimento manualmente
   - Dispatcha `StockMovementReversed`
   - **NOTE**: CreateStockMovementAction NON serve (fatto da GenerateStockMovementsListener)

**DDT** (6):
5. `CreateDdtAction` - Crea DDT in Draft
   - Dispatcha `DdtCreated`
6. `UpdateDdtAction` - Modifica DDT (solo Draft)
   - Dispatcha `DdtUpdated`
7. `DeleteDdtAction` - Elimina DDT (solo Draft)
   - Dispatcha `DdtDeleted`
8. **`ConfirmDdtAction`** 🔥 - Conferma DDT
   - Valida stock disponibile
   - Cambia status → Issued
   - Dispatcha `DdtConfirmed` → GenerateStockMovementsListener crea movimenti
9. **`CancelDdtAction`** 🔥 - Annulla DDT
   - Cambia status → Cancelled
   - Dispatcha `DdtCancelled` → ReverseStockMovementsListener storna movimenti
10. **`DeliverDdtAction`** 🔥 - Segna consegnato
    - Cambia status → Delivered
    - Dispatcha `DdtDelivered` → UpdateSiteMaterialsListener aggiorna site_materials

**Deliverable**: 10 Actions, tutte con DB::transaction() e dispatch eventi

---

### **FASE 6: Refactor Services** (2-3h) 🔴 CRITICA
**Problema**: Services hanno DB operations (violazione architettura)

**InventoryService**:
- ❌ Rimuovi TUTTE le query → Usa Query Classes nei Controller
- ❌ Rimuovi TUTTI i write → Usa Actions nei Controller
- ✅ Tieni SOLO calcoli (es. `calculateReorderQuantity()`, `calculateDaysOfStock()`)
- 🤔 Considera eliminare se vuoto

**DdtService**:
- ❌ Rimuovi TUTTE le query → Usa Query Classes
- ❌ Rimuovi TUTTI i write → Usa Actions
- ❌ Rimuovi processIncoming/processOutgoing/etc. → Spostati in GenerateStockMovementsListener
- ✅ Tieni SOLO calcoli (es. `calculateEstimatedDelivery()`, `isOverdue()`)
- 🤔 Considera eliminare se vuoto

**Deliverable**: Services puliti, solo utilities/calcoli

---

### **FASE 7: Update Controllers** (3-4h) 🔴 CRITICA
**Problema**: Controllers usano FormRequest, Service, Resources (vecchio pattern)

**InventoryController**:
- 🔄 `material_id` → `product_id` ovunque
- 🔄 Rimuovi validation manuale → usa `InventoryData::from($request)`
- 🔄 Rimuovi Service calls → usa Query Classes + Actions
- 🔄 Restituisci `InventoryData` (non Resources)

**StockMovementController**:
- 🔄 `material_id` → `product_id`
- 🔄 Rimuovi intake/output/transfer endpoints (fatto da listeners)
- 🔄 Tieni solo listing + reverse
- 🔄 Usa Query Classes + Actions

**DdtController**:
- ❌ Elimina `StoreDdtRequest.php` e `UpdateDdtRequest.php`
- 🔄 Usa `DdtData::from($request)` per validazione
- 🔄 Rimuovi DdtService calls → usa Query Classes + Actions
- 🔄 Restituisci `DdtData` (non DdtResource)

**Deliverable**: 3 Controllers aggiornati, 2 FormRequest eliminati

---

### **FASE 8: Backend Testing** (4-6h) 🟡 ALTA
**Problema**: Nessun test per nuovo codice

**Tests da Creare** (~25+):
- Unit tests per DTOs (4)
- Unit tests per Actions (10)
- Unit tests per Listeners (3 critici: Generate, Reverse, UpdateSiteMaterials)
- Integration tests per API endpoints (8)
- Feature tests per workflow (DDT confirm, cancel, deliver)

**Task**:
1. Crea factories (Inventory, StockMovement, Ddt, DdtItem)
2. Scrivi tests
3. Run `php artisan test` → 100% pass
4. Run `./vendor/bin/pint` → code style OK

**Deliverable**: 25+ tests passing, code style OK

---

### **FASE 9: Frontend Implementation** (8-12h) 🟡 ALTA
**Problema**: Frontend completamente assente

**Pages da Creare** (8):
1. `/inventory` - Lista inventory con filtri
2. `/inventory/[id]` - Dettaglio inventory con storico
3. `/stock-movements` - Lista movimenti con filtri
4. `/ddts` - Lista DDT con filtri
5. `/ddts/new` - Form creazione DDT
6. `/ddts/[id]` - Dettaglio DDT con azioni
7. `/ddts/[id]/edit` - Form modifica DDT (solo Draft)

**Components da Creare** (15):
- inventory-columns.tsx, inventory-adjust-dialog.tsx, inventory-transfer-dialog.tsx, inventory-stats.tsx
- stock-movement-columns.tsx, stock-movement-type-badge.tsx, stock-movement-filters.tsx
- ddt-form.tsx, ddt-columns.tsx, ddt-items-table.tsx, ddt-type-badge.tsx, ddt-status-badge.tsx, ddt-type-select.tsx, ddt-confirm-dialog.tsx, ddt-cancel-dialog.tsx

**API Clients da Creare** (3):
- `lib/api/inventory.ts` (8 endpoints)
- `lib/api/stock-movements.ts` (4 endpoints)
- `lib/api/ddts.ts` (9 endpoints)

**Deliverable**: UI completa, dark mode, navigation menu aggiornato

---

### **FASE 10: Frontend Testing** (2-3h) 🟢 MEDIA
**Problema**: Nessun test frontend

**Tests da Creare** (~15+):
- Component tests (Vitest): 10+
- E2E tests (Playwright): 5+ (Create DDT, Confirm DDT, Adjust Inventory)

**Deliverable**: Tests passing, lint OK

---

## ⏱️ SCHEDULE CONSIGLIATO (5 GIORNI)

### **Giorno 1** (8h) - Backend Foundation
- **09:00-13:00** (4h): Fase 1 + Fase 2
  - Fix Models (2h)
  - Create DTOs (2h)
  - ☕ Break
  - Milestone: DTOs creati, TS types generati
  
- **14:00-18:00** (4h): Fase 3 Start (Eventi)
  - Create 10 eventi (2h)
  - Start Listeners critici (2h)

### **Giorno 2** (8h) - Backend Core
- **09:00-13:00** (4h): Fase 3 Finish (Listeners)
  - GenerateStockMovementsListener (2h)
  - ReverseStockMovementsListener + UpdateSiteMaterialsListener (2h)
  - ☕ Break
  - Milestone: Architettura event-driven completa
  
- **14:00-18:00** (4h): Fase 4 (Query Classes)
  - 12 Query Classes (4h)

### **Giorno 3** (8h) - Backend Actions
- **09:00-13:00** (4h): Fase 5 Start (Actions)
  - Inventory Actions (2h)
  - StockMovement Actions (1h)
  - DDT Actions start (1h)
  - ☕ Break
  
- **14:00-18:00** (4h): Fase 5 Finish (Actions)
  - DDT Actions finish (4h - i più complessi)
  - Milestone: Tutte le Actions complete

### **Giorno 4** (8h) - Backend Completion + Testing
- **09:00-13:00** (4h): Fase 6 + Fase 7
  - Refactor Services (2h)
  - Update Controllers (2h)
  - ☕ Break
  - Milestone: Backend refactor completo
  
- **14:00-18:00** (4h): Fase 8 (Backend Testing)
  - Write tests (3h)
  - Run tests + fix (1h)
  - Milestone: Backend testato e funzionante ✅

### **Giorno 5** (8h) - Frontend Complete
- **09:00-13:00** (4h): Fase 9 Start
  - Inventory pages + components (3h)
  - Stock Movement pages + components (1h)
  - ☕ Break
  
- **14:00-18:00** (4h): Fase 9 Finish + Fase 10
  - DDT pages + components (2h)
  - API clients (1h)
  - Frontend testing (1h)
  - Milestone: **PROGETTO COMPLETO** 🎉

---

## 🎯 LISTENER CRITICI (Spiegazione Dettagliata)

### 1. GenerateStockMovementsListener (~400 righe) 🔥🔥🔥
**IL PIÙ IMPORTANTE DI TUTTI**

**Ascolta**: `DdtConfirmed` event

**Fa**: Crea movimenti stock basati sul tipo di DDT

**Logica**:
```php
public function handle(DdtConfirmed $event): void
{
    $ddt = $event->ddt->fresh(['items.product', 'fromWarehouse', 'toWarehouse']);
    
    match ($ddt->type) {
        DdtType::Incoming => $this->processIncoming($ddt),
        DdtType::Outgoing => $this->processOutgoing($ddt),
        DdtType::Internal => $this->processInternal($ddt),
        DdtType::RentalOut => $this->processRentalOut($ddt),
        DdtType::RentalReturn => $this->processRentalReturn($ddt),
        DdtType::ReturnFromCustomer => $this->processReturnFromCustomer($ddt),
        DdtType::ReturnToSupplier => $this->processReturnToSupplier($ddt),
    };
}

private function processIncoming(Ddt $ddt): void
{
    foreach ($ddt->items as $item) {
        // 1. Update inventory (INCREASE)
        $inventory = Inventory::firstOrCreate([
            'product_id' => $item->product_id,
            'warehouse_id' => $ddt->to_warehouse_id, // Warehouse di destinazione
        ]);
        $inventory->quantity_available += $item->quantity;
        $inventory->save();

        // 2. Create stock movement record
        $movement = StockMovement::create([
            'product_id' => $item->product_id,
            'warehouse_id' => $ddt->to_warehouse_id,
            'type' => StockMovementType::INTAKE,
            'quantity' => $item->quantity,
            'unit_cost' => $item->unit_cost,
            'movement_date' => $ddt->ddt_date,
            'supplier_id' => $ddt->supplier_id,
            'supplier_document' => $ddt->ddt_number,
            'ddt_id' => $ddt->id,
            'user_id' => auth()->id(),
            'notes' => "Intake from DDT {$ddt->code}",
        ]);

        // 3. Dispatch event (CheckLowStockAfterMovementListener will listen)
        StockMovementCreated::dispatch($movement);
    }
}

private function processOutgoing(Ddt $ddt): void
{
    foreach ($ddt->items as $item) {
        // 1. Update inventory (DECREASE)
        $inventory = Inventory::firstOrCreate([
            'product_id' => $item->product_id,
            'warehouse_id' => $ddt->from_warehouse_id, // Warehouse di origine
        ]);
        $inventory->quantity_available -= $item->quantity;
        $inventory->save();

        // 2. Create stock movement record
        $movement = StockMovement::create([
            'product_id' => $item->product_id,
            'warehouse_id' => $ddt->from_warehouse_id,
            'type' => StockMovementType::OUTPUT,
            'quantity' => $item->quantity,
            'unit_cost' => $item->unit_cost,
            'movement_date' => $ddt->ddt_date,
            'site_id' => $ddt->site_id,
            'ddt_id' => $ddt->id,
            'user_id' => auth()->id(),
            'notes' => "Output to " . ($ddt->site ? "site {$ddt->site->name}" : "customer") . " - DDT {$ddt->code}",
        ]);

        // 3. Dispatch event
        StockMovementCreated::dispatch($movement);
    }
}

private function processInternal(Ddt $ddt): void
{
    foreach ($ddt->items as $item) {
        // 1. DECREASE from origin
        $fromInventory = Inventory::firstOrCreate([
            'product_id' => $item->product_id,
            'warehouse_id' => $ddt->from_warehouse_id,
        ]);
        $fromInventory->quantity_available -= $item->quantity;
        $fromInventory->save();

        // 2. INCREASE to destination
        $toInventory = Inventory::firstOrCreate([
            'product_id' => $item->product_id,
            'warehouse_id' => $ddt->to_warehouse_id,
        ]);
        $toInventory->quantity_available += $item->quantity;
        $toInventory->save();

        // 3. Create SINGLE transfer movement
        $movement = StockMovement::create([
            'product_id' => $item->product_id,
            'warehouse_id' => $ddt->from_warehouse_id,
            'type' => StockMovementType::TRANSFER,
            'quantity' => $item->quantity,
            'unit_cost' => $item->unit_cost,
            'movement_date' => $ddt->ddt_date,
            'from_warehouse_id' => $ddt->from_warehouse_id,
            'to_warehouse_id' => $ddt->to_warehouse_id,
            'ddt_id' => $ddt->id,
            'user_id' => auth()->id(),
            'notes' => "Internal transfer - DDT {$ddt->code}",
        ]);

        // 4. Dispatch event
        StockMovementCreated::dispatch($movement);
    }
}

// Altri metodi: processRentalOut, processRentalReturn, processReturnFromCustomer, processReturnToSupplier
// Seguono logica simile
```

**Perché Critico**:
- Contiene TUTTA la business logic per generare movimenti
- Spostata qui da DdtService (prima era in Actions, sbagliato)
- Gestisce 7 tipi diversi di DDT
- Aggiorna inventory in modo corretto
- Dispatcha eventi per altri listener

### 2. ReverseStockMovementsListener (~200 righe) 🔥🔥
**Ascolta**: `DdtCancelled` event

**Fa**: Storna TUTTI i movimenti generati da un DDT

**Logica**:
```php
public function handle(DdtCancelled $event): void
{
    $ddt = $event->ddt->fresh(['stockMovements.product']);
    
    foreach ($ddt->stockMovements as $movement) {
        // 1. Reverse inventory changes
        $this->reverseInventoryChange($movement);
        
        // 2. Create compensating movement
        $reversingMovement = StockMovement::create([
            'product_id' => $movement->product_id,
            'warehouse_id' => $movement->warehouse_id,
            'type' => $this->getOppositeType($movement->type),
            'quantity' => $movement->quantity,
            'unit_cost' => $movement->unit_cost,
            'movement_date' => now(),
            'from_warehouse_id' => $movement->to_warehouse_id, // Reversed
            'to_warehouse_id' => $movement->from_warehouse_id, // Reversed
            'ddt_id' => $ddt->id,
            'user_id' => auth()->id(),
            'notes' => "Reversal of movement {$movement->code} due to DDT cancellation. Reason: {$event->reason}",
            'reference_document' => "REV-{$movement->code}",
        ]);
        
        // 3. Mark original movement as reversed
        $movement->update(['reversed_by' => $reversingMovement->id]);
        
        // 4. Dispatch event
        StockMovementReversed::dispatch($movement, $reversingMovement, $event->reason);
    }
}

private function reverseInventoryChange(StockMovement $movement): void
{
    $inventory = Inventory::where('product_id', $movement->product_id)
        ->where('warehouse_id', $movement->warehouse_id)
        ->firstOrFail();

    // Opposite of original operation
    match ($movement->type) {
        StockMovementType::INTAKE => $inventory->quantity_available -= $movement->quantity,
        StockMovementType::OUTPUT => $inventory->quantity_available += $movement->quantity,
        StockMovementType::TRANSFER => $this->reverseTransfer($movement),
        default => throw new \Exception("Cannot reverse movement type: {$movement->type->value}"),
    };

    $inventory->save();
}
```

**Perché Critico**:
- Deve ripristinare PERFETTAMENTE lo stato precedente
- Gestisce tutti i tipi di movimento
- Crea movimenti compensativi per audit trail
- Se sbaglia, inventory diventa inconsistente

### 3. UpdateSiteMaterialsListener (~100 righe) 🔥🔥
**Ascolta**: `DdtDelivered` event

**Fa**: Aggiorna `site_materials` quando DDT outgoing a cantiere è consegnato

**Logica**:
```php
public function handle(DdtDelivered $event): void
{
    $ddt = $event->ddt->fresh(['items.product', 'site']);
    
    // Solo per DDT outgoing verso cantieri
    if ($ddt->type !== DdtType::Outgoing || !$ddt->site_id) {
        return;
    }
    
    foreach ($ddt->items as $item) {
        // Update or create site_materials record
        $siteMaterial = SiteMaterial::firstOrCreate([
            'site_id' => $ddt->site_id,
            'product_id' => $item->product_id,
        ], [
            'quantity_allocated' => 0,
            'quantity_delivered' => 0,
            'quantity_used' => 0,
        ]);
        
        // Increase delivered quantity
        $siteMaterial->quantity_delivered += $item->quantity;
        $siteMaterial->save();
        
        Log::info("Updated site materials", [
            'site_id' => $ddt->site_id,
            'product_id' => $item->product_id,
            'quantity_added' => $item->quantity,
            'new_total' => $siteMaterial->quantity_delivered,
        ]);
    }
}
```

**Perché Critico**:
- Sincronizza inventory cantiere con magazzino centrale
- Essenziale per tracking materiali in cantiere
- Se non funziona, cantiere ha dati errati

---

## ✅ CHECKLIST FINALE PRE-START

### Prima di Iniziare (30 min):
- [ ] Leggi `WAREHOUSE_IMPLEMENTATION_ROADMAP.md` (questo documento)
- [ ] Leggi `/backend/AI_ARCHITECTURE_RULES.md` (OBBLIGATORIO)
- [ ] Leggi `WAREHOUSE_MODULE_REFACTOR_CHECKLIST.md` (per dettagli tecnici)
- [ ] Comprendi architettura event-driven (diagramma sopra)

### Setup Iniziale:
```bash
cd /Users/davidedonghi/Apps/dggm

# Crea branch per refactor
git checkout -b feature/warehouse-event-driven-refactor

# Backup
git commit -am "Backup before warehouse refactor"

# Verifica migrations
cd backend
php artisan migrate:status | grep -i "material\|product\|inventory\|stock"
```

### Durante Implementazione:
- [ ] Segui fasi sequenzialmente (1 → 2 → 3 → ... → 10)
- [ ] Testa dopo ogni fase
- [ ] Commit dopo ogni fase
- [ ] Aggiorna WAREHOUSE_IMPLEMENTATION_ROADMAP.md con progresso

### Dopo Ogni Fase:
```bash
# Code style
./vendor/bin/pint

# Generate TS types (dopo Fase 2)
php artisan typescript:transform

# Run tests
php artisan test

# Commit
git add .
git commit -m "Phase X complete: [descrizione]"
```

### Dopo Completamento:
- [ ] Update `/TODO.md` con status completamento
- [ ] Run `./vendor/bin/pint` (backend)
- [ ] Run `php artisan typescript:transform` (TS types)
- [ ] Run `npm run lint:fix` (frontend)
- [ ] Run `php artisan test` → 100% pass
- [ ] Run `npm run test` → pass
- [ ] Manual testing di tutti i workflow
- [ ] Mark checklist as complete ✅

---

## 🚀 PRIMO TASK (ORA)

**Task**: Fase 1 - Fix StockMovement Model

**Tempo**: 30 minuti

**Steps**:
1. Apri `/backend/app/Models/StockMovement.php`
2. Trova array `$fillable`
3. Cambia `'material_id'` → `'product_id'`
4. Trova relationship `material()`
5. Rinomina in `product()`
6. Cambia `Material::class` → `Product::class`
7. Salva
8. Test rapido:
```bash
php artisan tinker
>>> $movement = \App\Models\StockMovement::with('product')->first();
>>> $movement->product; // Dovrebbe funzionare
```

**Se funziona**: Passa a DdtItem model (stesso processo)

---

## 📊 METRICHE DI SUCCESSO

### Completion Criteria
- ✅ 4 models aggiornati (Product non Material)
- ✅ 4 DTOs creati + TS types
- ✅ 10 eventi creati
- ✅ 10 listeners creati + registrati
- ✅ 12 Query Classes create
- ✅ 10 Actions create
- ✅ Services senza DB operations
- ✅ Controllers usano DTOs + Actions + Queries
- ✅ 25+ backend tests pass
- ✅ 8 frontend pages create
- ✅ 15 frontend components creati
- ✅ 3 API clients creati
- ✅ 15+ frontend tests pass

### Quality Targets
- **Code Coverage**: 80%+ per Actions/Listeners
- **Type Safety**: 100% (TS types auto-generati)
- **Architecture Compliance**: 100% (tutte le regole seguite)
- **Performance**: DDT confirm < 500ms, Inventory list < 200ms
- **Zero Errors**: `php artisan test` + `npm run test` 100% pass

---

## 📞 SUPPORTO

### Domande Durante Implementazione:
1. Consulta `WAREHOUSE_MODULE_REFACTOR_CHECKLIST.md` per codice dettagliato
2. Consulta `AI_ARCHITECTURE_RULES.md` per regole architetturali
3. Guarda esempi esistenti:
   - DTOs: `/backend/app/Data/ProductData.php`
   - Actions: `/backend/app/Actions/Product/`
   - Query Classes: `/backend/app/Queries/Product/`
   - Events: `/backend/app/Events/WarehouseCreated.php`
   - Listeners: `/backend/app/Listeners/SendLowStockAlert.php`

### Se Blocchi:
- Controlla che migrations siano run: `php artisan migrate:status`
- Verifica dipendenze: `composer dump-autoload`
- Clear cache: `php artisan optimize:clear`
- Check errors: `tail -f storage/logs/laravel.log`

---

## 🎉 RISULTATO FINALE

Dopo 32-44 ore (5 giorni) avrai:

✅ **Backend Completo**:
- Architettura event-driven ✅
- 4 DTOs con TS types ✅
- 10 Events + 10 Listeners ✅
- 12 Query Classes ✅
- 10 Actions ✅
- Services puliti ✅
- Controllers moderni ✅
- 25+ tests passing ✅

✅ **Frontend Completo**:
- 8 pages funzionanti ✅
- 15 components riusabili ✅
- 3 API clients ✅
- Dark mode support ✅
- 15+ tests passing ✅

✅ **Qualità**:
- 100% architecture compliance ✅
- 100% type safety (TypeScript) ✅
- 80%+ code coverage ✅
- Zero errors ✅
- Performance ottimizzata ✅

---

**Creato**: 23 Gennaio 2026  
**Last Updated**: 23 Gennaio 2026  
**Status**: ✅ Pronto per Implementazione  
**Next Step**: Fase 1 - Fix Backend Models (30 min) → Inizia ORA! 🚀
