# 📦 Roadmap Modulo Magazzino - DGGM ERP

## 📋 Indice
1. [Stato Attuale](#stato-attuale)
2. [Architettura Database](#architettura-database)
3. [Roadmap Implementazione](#roadmap-implementazione)
4. [Linee Guida Backend](#linee-guida-backend)
5. [Linee Guida Frontend](#linee-guida-frontend)
6. [Best Practices](#best-practices)
7. [Testing Strategy](#testing-strategy)

---

## 🎯 Stato Attuale

### ✅ Completato
- [x] Tabella `materials` (catalogo prodotti)
- [x] Tabella `warehouses` (multi-magazzino)
- [x] Tabella `inventory` (giacenze per magazzino)
- [x] Tabella `stock_movements` (movimentazioni)
- [x] Tabella `site_materials` (assegnazioni cantieri)
- [x] Models: Material, Warehouse, Inventory, StockMovement, SiteMaterial
- [x] Enums: MaterialType, StockMovementType, SiteMaterialStatus, WarehouseType
- [x] MaterialSeeder con 22 materiali di esempio
- [x] SiteMaterialController (CRUD + logUsage)
- [x] Conversione Quote → Site con creazione automatica materiali

### ⏳ In Progress
- [ ] InventoryController (query giacenze)
- [ ] StockMovementController (movimentazioni)
- [ ] MaterialController (CRUD catalogo)
- [ ] WarehouseController (CRUD magazzini)

### 📅 Da Fare
- [ ] InventoryService (business logic)
- [ ] Low stock alerts
- [ ] Barcode/QR integration
- [ ] Stock valuation reports
- [ ] Inventory adjustments
- [ ] Frontend pages complete

---

## 🗄️ Architettura Database

### Schema Completo

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   materials     │       │   inventory      │       │   warehouses    │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id              │───┐   │ id               │   ┌───│ id              │
│ code            │   │   │ material_id      │───┘   │ code            │
│ name            │   └──>│ warehouse_id     │       │ name            │
│ product_type    │       │ quantity_avail   │       │ type            │
│ category        │       │ quantity_reserved│       │ manager_id      │
│ unit            │       │ quantity_transit │       │ address         │
│ standard_cost   │       │ minimum_stock    │       │ is_active       │
│ purchase_price  │       │ maximum_stock    │       └─────────────────┘
│ sale_price      │       │ last_count_date  │
│ markup_%        │       └──────────────────┘
│ is_rentable     │
│ barcode         │       ┌──────────────────┐
│ qr_code         │       │ stock_movements  │
│ reorder_level   │       ├──────────────────┤
│ default_supp_id │       │ id               │
└─────────────────┘       │ code (MOV-...)   │
                          │ material_id      │───┐
                          │ warehouse_id     │   │
        ┌─────────────────│ type             │   │
        │                 │ quantity         │   │
        │                 │ unit_cost        │   │
        │                 │ movement_date    │   │
        │                 │ from_warehouse_id│   │
        │                 │ to_warehouse_id  │   │
        │                 │ site_id          │   │
        │                 │ supplier_id      │   │
        │                 │ user_id          │   │
        │                 └──────────────────┘   │
        │                                        │
        │                 ┌──────────────────┐   │
        └────────────────>│ site_materials   │<──┘
                          ├──────────────────┤
                          │ id               │
                          │ site_id          │
                          │ material_id      │
                          │ quote_item_id    │
                          │ is_extra         │
                          │ requested_by     │
                          │ extra_reason     │
                          │ planned_quantity │
                          │ allocated_qty    │
                          │ delivered_qty    │
                          │ used_quantity    │
                          │ returned_qty     │
                          │ planned_cost     │
                          │ actual_cost      │
                          │ status           │
                          └──────────────────┘
```

### Relazioni Chiave

1. **Material → Inventory** (1:N): Un materiale può avere giacenze in più magazzini
2. **Warehouse → Inventory** (1:N): Un magazzino contiene più materiali
3. **Material → StockMovements** (1:N): Ogni materiale ha storico movimentazioni
4. **Material → SiteMaterials** (1:N): Materiali assegnati a cantieri
5. **Warehouse → StockMovements** (1:N): Movimentazioni per magazzino

---

## 🛣️ Roadmap Implementazione

### 🚀 FASE 1: Core Inventory Management (PRIORITÀ ALTA)

**Obiettivo**: Sistema base per gestire giacenze e movimentazioni

#### 1.1 Backend - InventoryController ⭐ CRITICO
**File**: `/backend/app/Http/Controllers/Api/V1/InventoryController.php`

**Endpoints da implementare**:
```php
// Query giacenze
GET    /api/v1/inventory                     // Tutte le giacenze (con filtri)
GET    /api/v1/inventory/warehouse/{id}      // Giacenze per magazzino
GET    /api/v1/inventory/material/{id}       // Giacenze per materiale (multi-warehouse)
GET    /api/v1/inventory/low-stock           // Alert scorte basse
GET    /api/v1/inventory/valuation           // Valorizzazione magazzino

// Gestione giacenze
POST   /api/v1/inventory/adjust              // Rettifica manuale giacenza
POST   /api/v1/inventory/minimum-stock       // Imposta scorta minima
```

**Metodi chiave**:
```php
public function index(Request $request): JsonResponse
{
    // Filtri: warehouse_id, material_id, category, low_stock, search
    // Eager load: material, warehouse
    // Ordinamento: material.name, quantity_available, last_count_date
    // Paginazione: 50 per page
}

public function byWarehouse(int $warehouseId): JsonResponse
{
    // Lista giacenze di un magazzino specifico
    // Include: material details, quantity_free (available - reserved)
    // Stats: total_items, total_value, low_stock_count
}

public function byMaterial(int $materialId): JsonResponse
{
    // Giacenze materiale in tutti i magazzini
    // Include: warehouse details, quantity breakdown
    // Stats: total_available, total_reserved, total_in_transit
}

public function lowStock(): JsonResponse
{
    // Materiali sotto scorta minima
    // Where: quantity_available <= minimum_stock
    // Include: reorder suggestions (reorder_quantity, lead_time)
    // Priority: critical (qty=0), low, warning
}

public function valuation(): JsonResponse
{
    // Valorizzazione magazzino
    // Calcolo: quantity_available * standard_cost
    // Group by: warehouse, category, product_type
    // Stats: total_value, items_count, avg_cost
}

public function adjust(Request $request): JsonResponse
{
    // Validation: material_id, warehouse_id, quantity, reason
    // Create StockMovement type='adjustment'
    // Update Inventory quantity_available
    // Log: user_id, notes
}
```

**Validation Rules**:
```php
// adjust
'material_id' => 'required|exists:materials,id',
'warehouse_id' => 'required|exists:warehouses,id',
'quantity' => 'required|numeric', // può essere negativo per decremento
'reason' => 'required|string|max:500',
'unit_cost' => 'nullable|numeric|min:0',
'notes' => 'nullable|string|max:1000',
```

#### 1.2 Backend - StockMovementController ⭐ CRITICO
**File**: `/backend/app/Http/Controllers/Api/V1/StockMovementController.php`

**Endpoints**:
```php
// Query movimentazioni
GET    /api/v1/stock-movements                      // Storico (con filtri)

// Operazioni magazzino
POST   /api/v1/stock-movements/intake               // Carico merce (da fornitore)
POST   /api/v1/stock-movements/output               // Scarico merce (vendita/uso)
POST   /api/v1/stock-movements/transfer             // Trasferimento tra magazzini
POST   /api/v1/stock-movements/adjustment           // Rettifica inventario

// Operazioni cantiere
POST   /api/v1/stock-movements/deliver-to-site      // Consegna a cantiere
POST   /api/v1/stock-movements/return-from-site     // Reso da cantiere

// Noleggio (FASE 2)
POST   /api/v1/stock-movements/rental-out           // Noleggio uscita
POST   /api/v1/stock-movements/rental-return        // Rientro da noleggio
```

**Metodi chiave**:
```php
public function index(Request $request): JsonResponse
{
    // Filtri: warehouse_id, material_id, type, site_id, date_from, date_to
    // Eager load: material, warehouse, site, user, supplier
    // Ordinamento: movement_date DESC
    // Paginazione: 100 per page
}

public function intake(Request $request): JsonResponse
{
    // Carico merce da fornitore
    // 1. Validate: material_id, warehouse_id, quantity, unit_cost, supplier_id
    // 2. Create StockMovement (type='intake')
    // 3. Update Inventory: quantity_available += quantity
    // 4. Generate code: "MOV-{date}-{sequential}"
    // 5. Log: supplier_document (DDT/Fattura)
}

public function output(Request $request): JsonResponse
{
    // Scarico merce (vendita, uso interno, scarto)
    // 1. Validate: material_id, warehouse_id, quantity, reason
    // 2. Check availability: inventory.quantity_free >= quantity
    // 3. Create StockMovement (type='output')
    // 4. Update Inventory: quantity_available -= quantity
}

public function transfer(Request $request): JsonResponse
{
    // Trasferimento tra magazzini
    // 1. Validate: material_id, from_warehouse_id, to_warehouse_id, quantity
    // 2. Check availability in source warehouse
    // 3. Create StockMovement (type='transfer')
    // 4. Update source: quantity_available -= quantity, quantity_in_transit += quantity
    // 5. Update destination: quantity_in_transit += quantity
    // 6. When confirmed: source.in_transit -= qty, dest.available += qty
}

public function deliverToSite(Request $request): JsonResponse
{
    // Consegna materiale a cantiere
    // 1. Validate: site_id, material_id, warehouse_id, quantity
    // 2. Check SiteMaterial exists (planned)
    // 3. Check warehouse availability
    // 4. Create StockMovement (type='site_delivery')
    // 5. Update Inventory: quantity_available -= quantity
    // 6. Update SiteMaterial: delivered_quantity += quantity, status='delivered'
}

public function returnFromSite(Request $request): JsonResponse
{
    // Reso materiale da cantiere
    // 1. Validate: site_id, material_id, warehouse_id, quantity
    // 2. Check SiteMaterial delivered_quantity >= quantity
    // 3. Create StockMovement (type='site_return')
    // 4. Update Inventory: quantity_available += quantity
    // 5. Update SiteMaterial: returned_quantity += quantity
}
```

**Transaction Safety**: Tutte le operazioni devono usare `DB::transaction()` per garantire atomicità.

#### 1.3 Backend - InventoryService ⭐ CRITICO
**File**: `/backend/app/Services/InventoryService.php`

**Business Logic**:
```php
class InventoryService
{
    /**
     * Reserve stock for a site
     */
    public function reserveForSite(
        int $siteId,
        int $materialId,
        int $warehouseId,
        float $quantity
    ): bool {
        return DB::transaction(function () use ($siteId, $materialId, $warehouseId, $quantity) {
            // 1. Find inventory record
            $inventory = Inventory::where('material_id', $materialId)
                ->where('warehouse_id', $warehouseId)
                ->lockForUpdate()
                ->first();

            // 2. Check availability
            if ($inventory->getQuantityFreeAttribute() < $quantity) {
                throw new InsufficientStockException();
            }

            // 3. Reserve quantity
            $inventory->quantity_reserved += $quantity;
            $inventory->save();

            // 4. Update SiteMaterial
            $siteMaterial = SiteMaterial::where('site_id', $siteId)
                ->where('material_id', $materialId)
                ->first();

            $siteMaterial->allocated_quantity += $quantity;
            $siteMaterial->status = 'reserved';
            $siteMaterial->save();

            return true;
        });
    }

    /**
     * Release reservation (undo reserve)
     */
    public function releaseReservation(int $siteId, int $materialId, float $quantity): bool
    {
        // Decrement quantity_reserved
        // Update SiteMaterial allocated_quantity
    }

    /**
     * Get low stock materials with reorder suggestions
     */
    public function getLowStockMaterials(): Collection
    {
        return Material::with('inventory')
            ->whereHas('inventory', function ($query) {
                $query->whereRaw('quantity_available <= minimum_stock');
            })
            ->get()
            ->map(function ($material) {
                return [
                    'material' => $material,
                    'total_stock' => $material->inventory->sum('quantity_available'),
                    'total_reserved' => $material->inventory->sum('quantity_reserved'),
                    'reorder_quantity' => $material->reorder_quantity,
                    'lead_time_days' => $material->lead_time_days,
                    'supplier' => $material->defaultSupplier,
                    'priority' => $this->calculatePriority($material),
                ];
            });
    }

    /**
     * Calculate stock valuation
     */
    public function getStockValuation(int $warehouseId = null): array
    {
        $query = Inventory::with('material', 'warehouse');

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $inventories = $query->get();

        return [
            'total_value' => $inventories->sum(function ($inv) {
                return $inv->quantity_available * $inv->material->standard_cost;
            }),
            'total_items' => $inventories->count(),
            'by_warehouse' => $this->groupByWarehouse($inventories),
            'by_category' => $this->groupByCategory($inventories),
            'by_product_type' => $this->groupByProductType($inventories),
        ];
    }

    /**
     * Process stock movement
     */
    protected function processMovement(
        StockMovementType $type,
        int $materialId,
        int $warehouseId,
        float $quantity,
        float $unitCost,
        array $metadata = []
    ): StockMovement {
        return DB::transaction(function () use ($type, $materialId, $warehouseId, $quantity, $unitCost, $metadata) {
            // 1. Create movement record
            $movement = StockMovement::create([
                'code' => StockMovement::generateCode(),
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
                'type' => $type,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'movement_date' => now(),
                'user_id' => auth()->id(),
                ...$metadata,
            ]);

            // 2. Update inventory based on type
            $this->updateInventoryForMovement($movement);

            return $movement;
        });
    }

    /**
     * Update inventory based on movement type
     */
    protected function updateInventoryForMovement(StockMovement $movement): void
    {
        $inventory = Inventory::firstOrCreate(
            [
                'material_id' => $movement->material_id,
                'warehouse_id' => $movement->warehouse_id,
            ],
            [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
                'quantity_in_transit' => 0,
                'minimum_stock' => 0,
            ]
        );

        match ($movement->type->value) {
            'intake' => $inventory->quantity_available += $movement->quantity,
            'output' => $inventory->quantity_available -= $movement->quantity,
            'transfer' => $this->handleTransfer($movement, $inventory),
            'adjustment' => $inventory->quantity_available += $movement->quantity, // può essere negativo
            'site_delivery' => $inventory->quantity_available -= $movement->quantity,
            'site_return' => $inventory->quantity_available += $movement->quantity,
            default => throw new \InvalidArgumentException("Unknown movement type: {$movement->type->value}"),
        };

        $inventory->save();
    }
}
```

#### 1.4 Backend - MaterialController
**File**: `/backend/app/Http/Controllers/Api/V1/MaterialController.php`

**Endpoints**:
```php
// CRUD base
GET    /api/v1/materials                    // Lista catalogo (con filtri)
POST   /api/v1/materials                    // Crea nuovo materiale
GET    /api/v1/materials/{id}               // Dettaglio materiale
PATCH  /api/v1/materials/{id}               // Aggiorna materiale
DELETE /api/v1/materials/{id}               // Elimina materiale (soft delete)

// Query speciali
GET    /api/v1/materials/categories/list    // Lista categorie uniche
GET    /api/v1/materials-needing-reorder    // Materiali da riordinare
GET    /api/v1/materials/{id}/kit-breakdown // Componenti kit (FASE 2)
POST   /api/v1/materials/{id}/calculate-price // Ricalcola prezzi kit (FASE 2)
```

**Filtri index()**:
- `is_active`: boolean
- `category`: string (construction, electrical, plumbing, equipment, labor, other)
- `product_type`: enum (physical, service, kit)
- `rentable`: boolean
- `kits`: boolean (only kits)
- `low_stock`: boolean (with inventory check)
- `search`: string (code, name, description, barcode)
- `sort_field`: code, name, standard_cost, reorder_level
- `sort_direction`: asc, desc

#### 1.5 Backend - WarehouseController
**File**: `/backend/app/Http/Controllers/Api/V1/WarehouseController.php`

**Endpoints**:
```php
GET    /api/v1/warehouses           // Lista magazzini
POST   /api/v1/warehouses           // Crea magazzino
GET    /api/v1/warehouses/{id}      // Dettaglio magazzino
PATCH  /api/v1/warehouses/{id}      // Aggiorna magazzino
DELETE /api/v1/warehouses/{id}      // Disattiva magazzino
```

**Validation**:
```php
'code' => 'required|string|unique:warehouses,code',
'name' => 'required|string|max:255',
'type' => 'required|in:central,site_storage,mobile_truck',
'address' => 'nullable|string',
'city' => 'nullable|string',
'manager_id' => 'nullable|exists:users,id',
'is_active' => 'boolean',
```

---

### 🎨 FASE 2: Frontend Inventory Management

#### 2.1 Pagina Lista Materiali
**File**: `/frontend/app/dashboard/materials/page.tsx`

**Features**:
- Tabella materiali con ricerca e filtri
- Colonne: Code, Nome, Categoria, Tipo, Unità, Costo Std, Stock Totale, Status
- Badge low stock (rosso se sotto minimo)
- Azioni: Edit, Duplicate, Delete
- Bulk actions: Export CSV/Excel, Print labels
- FAB "Nuovo Materiale"

**Componenti**:
```tsx
<MaterialsTable>
  - Filtri: categoria, tipo, attivi, low stock
  - Sort: code, name, cost
  - Pagination
  - Empty state

<MaterialFormDialog>
  - Tabs: Info, Prezzi, Stock, Barcode
  - Validation real-time
  - Image upload

<LowStockAlert>
  - Banner top se ci sono materiali sotto scorta
  - Link diretto a "Materials Needing Reorder"
```

#### 2.2 Pagina Dettaglio Materiale
**File**: `/frontend/app/dashboard/materials/[id]/page.tsx`

**Sezioni**:
1. **Header**: Code, Nome, Categoria, Status badge
2. **Info Generali**: Descrizione, Tipo prodotto, Unità misura
3. **Prezzi**: Costo std, Acquisto, Vendita, Markup %
4. **Stock**: Card per ogni magazzino (Disponibile, Riservato, In transito)
5. **Alert Riordino**: Livello riordino, Quantità, Lead time, Fornitore
6. **Storico Movimenti**: Ultimi 20 movimenti
7. **Utilizzo Cantieri**: Cantieri dove è utilizzato
8. **Barcode/QR**: Visualizzazione e download

**Actions**:
- Adjust Stock (dialog)
- Generate Barcode/QR
- Print Label
- Export Movement History

#### 2.3 Pagina Inventario
**File**: `/frontend/app/dashboard/inventory/page.tsx`

**Features**:
- Vista per magazzino (tabs o select)
- Tabella giacenze con:
  - Materiale (code + nome)
  - Disponibile
  - Riservato
  - In transito
  - Libero (disponibile - riservato)
  - Scorta minima
  - Progress bar (attuale/minimo)
  - Valore (qty * costo)
- Summary cards:
  - Totale articoli
  - Valore magazzino
  - Articoli sotto scorta
  - Ultimo inventario
- Quick actions:
  - Adjust stock
  - Print inventory report
  - Export Excel

#### 2.4 Pagina Movimentazioni
**File**: `/frontend/app/dashboard/stock-movements/page.tsx`

**Features**:
- Filtri: Data, Tipo, Magazzino, Materiale, Cantiere
- Timeline view / Table view (toggle)
- Colonne: Data, Code, Tipo (badge), Materiale, Qty, Da/A, User
- Quick filters: Oggi, Settimana, Mese
- Actions rapide:
  - Nuovo carico
  - Nuovo scarico
  - Trasferimento
  - Consegna cantiere

**Dialogs**:
```tsx
<IntakeDialog>
  - Select materiale (autocomplete)
  - Magazzino destinazione
  - Quantità
  - Costo unitario
  - Fornitore
  - Numero DDT/Fattura
  - Note

<OutputDialog>
  - Select materiale
  - Magazzino origine
  - Quantità (max disponibile)
  - Motivo (vendita, uso interno, scarto)
  - Note

<TransferDialog>
  - Select materiale
  - Da magazzino
  - A magazzino
  - Quantità
  - Data trasferimento
  - Note

<DeliverToSiteDialog>
  - Select cantiere
  - Select materiale (da SiteMaterials)
  - Magazzino origine
  - Quantità (max pianificato - consegnato)
  - Data consegna
  - DDT
```

#### 2.5 Componenti Riusabili

```tsx
// Material Selector con stock info
<MaterialSelector
  value={materialId}
  onChange={setMaterialId}
  warehouseId={warehouseId}  // opzionale, mostra stock di quel magazzino
  showStock={true}
  showPrice={true}
  filterBy={{ category, type, active }}
/>

// Stock Badge
<StockBadge
  quantity={50}
  minimum={100}
  reserved={20}
  size="sm"  // sm, md, lg
/>

// Movement Type Badge
<MovementTypeBadge type="intake" />
// Colori: intake=green, output=red, transfer=blue, adjustment=yellow

// Warehouse Selector
<WarehouseSelector
  value={warehouseId}
  onChange={setWarehouseId}
  showStock={true}  // mostra totale articoli
  activeOnly={true}
/>
```

---

### 🔄 FASE 3: Advanced Features

#### 3.1 Barcode/QR Integration
- Generazione automatica QR code per materiali
- Scan QR per movimentazioni rapide
- Print labels con barcode
- Mobile scanner integration

**Librerie**:
- Backend: `milon/barcode` o `bacon/bacon-qr-code`
- Frontend: `react-qr-code`, `react-barcode-reader`

#### 3.2 Kit Management
- Materiali compositi (es: "Kit Bagno Completo")
- Bill of Materials (BOM)
- Auto-calcolo costi da componenti
- Explosion kit per consegne cantiere

**Tabella aggiuntiva**: `material_components`
```php
Schema::create('material_components', function (Blueprint $table) {
    $table->id();
    $table->foreignId('kit_id')->constrained('materials')->cascadeOnDelete();
    $table->foreignId('component_id')->constrained('materials')->cascadeOnDelete();
    $table->decimal('quantity', 10, 2);
    $table->string('unit');
    $table->timestamps();
});
```

#### 3.3 Rental Management (Noleggio)
- Check-out attrezzature (con tracking GPS)
- Check-in con damage report
- Tariffe: giornaliera, settimanale, mensile
- Calcolo automatico costi noleggio
- Alert scadenza noleggio

**Tabella**: `rentals`
```php
Schema::create('rentals', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique(); // RENT-20260109-001
    $table->foreignId('material_id')->constrained()->cascadeOnDelete();
    $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
    $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
    $table->decimal('quantity', 10, 2);
    $table->date('checkout_date');
    $table->date('expected_return_date');
    $table->date('actual_return_date')->nullable();
    $table->decimal('daily_rate', 10, 2);
    $table->decimal('total_cost', 12, 2)->nullable();
    $table->string('status'); // active, returned, overdue
    $table->text('checkout_notes')->nullable();
    $table->text('return_notes')->nullable();
    $table->boolean('has_damage')->default(false);
    $table->decimal('damage_cost', 10, 2)->nullable();
    $table->timestamps();
});
```

#### 3.4 Purchase Orders (Ordini Fornitori)
- Creazione automatica da materiali sotto scorta
- Invio ordine a fornitore (email/PDF)
- Tracking stato ordine
- Ricezione parziale/totale
- Integrazione con stock intake

**Tabella**: `purchase_orders`
```php
Schema::create('purchase_orders', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique(); // PO-2026-001
    $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
    $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
    $table->date('order_date');
    $table->date('expected_delivery_date')->nullable();
    $table->date('actual_delivery_date')->nullable();
    $table->decimal('total_amount', 12, 2);
    $table->string('status'); // draft, sent, confirmed, partially_received, received, cancelled
    $table->text('notes')->nullable();
    $table->timestamps();
});

Schema::create('purchase_order_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
    $table->foreignId('material_id')->constrained()->cascadeOnDelete();
    $table->decimal('quantity_ordered', 10, 2);
    $table->decimal('quantity_received', 10, 2)->default(0);
    $table->decimal('unit_price', 10, 2);
    $table->decimal('subtotal', 12, 2);
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

---

## 📐 Linee Guida Backend

### Service Layer Pattern
**OBBLIGATORIO**: Tutta la business logic va nei Services, NON nei Controllers.

```php
// ❌ SBAGLIATO - Logic nel controller
class InventoryController extends Controller
{
    public function adjust(Request $request)
    {
        $inventory = Inventory::find(...);
        $inventory->quantity_available += $request->quantity;
        $inventory->save();

        StockMovement::create([...]);
    }
}

// ✅ CORRETTO - Logic nel service
class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {}

    public function adjust(Request $request)
    {
        $this->authorize('adjust', Inventory::class);

        $validated = $request->validated();

        $this->inventoryService->adjustStock(
            $validated['material_id'],
            $validated['warehouse_id'],
            $validated['quantity'],
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock adjusted successfully',
        ]);
    }
}
```

### Transaction Safety
**OBBLIGATORIO**: Usare transazioni per operazioni multi-step.

```php
use Illuminate\Support\Facades\DB;

public function deliverToSite(int $siteId, int $materialId, float $quantity): bool
{
    return DB::transaction(function () use ($siteId, $materialId, $quantity) {
        // 1. Lock inventory
        $inventory = Inventory::where('material_id', $materialId)
            ->where('warehouse_id', $warehouseId)
            ->lockForUpdate()
            ->firstOrFail();

        // 2. Check availability
        if ($inventory->quantity_available < $quantity) {
            throw new InsufficientStockException();
        }

        // 3. Create movement
        $movement = StockMovement::create([...]);

        // 4. Update inventory
        $inventory->decrement('quantity_available', $quantity);

        // 5. Update site material
        $siteMaterial = SiteMaterial::findOrFail($siteMaterialId);
        $siteMaterial->increment('delivered_quantity', $quantity);
        $siteMaterial->update(['status' => 'delivered']);

        return true;
    });
}
```

### Resource Pattern
Standardizzare output API con Resources.

```php
// app/Http/Resources/InventoryResource.php
class InventoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'material' => [
                'id' => $this->material->id,
                'code' => $this->material->code,
                'name' => $this->material->name,
                'unit' => $this->material->unit,
                'standard_cost' => $this->material->standard_cost,
            ],
            'warehouse' => [
                'id' => $this->warehouse->id,
                'code' => $this->warehouse->code,
                'name' => $this->warehouse->name,
            ],
            'quantity_available' => $this->quantity_available,
            'quantity_reserved' => $this->quantity_reserved,
            'quantity_in_transit' => $this->quantity_in_transit,
            'quantity_free' => $this->quantity_free, // accessor
            'minimum_stock' => $this->minimum_stock,
            'maximum_stock' => $this->maximum_stock,
            'is_low_stock' => $this->is_low_stock, // accessor
            'stock_value' => $this->stock_value, // accessor: qty * cost
            'last_count_date' => $this->last_count_date?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
```

### Validation con Form Requests
```php
// app/Http/Requests/AdjustStockRequest.php
class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('inventory.adjust');
    }

    public function rules(): array
    {
        return [
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|not_in:0',
            'reason' => 'required|string|max:500',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'quantity.not_in' => 'La quantità non può essere zero',
            'reason.required' => 'Il motivo della rettifica è obbligatorio',
        ];
    }
}
```

### Exception Handling
Creare eccezioni custom per casi specifici.

```php
// app/Exceptions/InsufficientStockException.php
class InsufficientStockException extends Exception
{
    public function __construct(
        public readonly int $materialId,
        public readonly float $requested,
        public readonly float $available
    ) {
        parent::__construct("Stock insufficiente per materiale #{$materialId}");
    }

    public function render($request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Stock insufficiente',
            'error' => [
                'material_id' => $this->materialId,
                'requested' => $this->requested,
                'available' => $this->available,
            ],
        ], 422);
    }
}
```

---

## 🎨 Linee Guida Frontend

### Component Structure
```
/frontend
├── app/
│   └── dashboard/
│       ├── materials/
│       │   ├── page.tsx              # Lista materiali
│       │   ├── [id]/
│       │   │   └── page.tsx          # Dettaglio materiale
│       │   └── new/
│       │       └── page.tsx          # Nuovo materiale
│       ├── inventory/
│       │   ├── page.tsx              # Vista inventario
│       │   └── warehouse/
│       │       └── [id]/page.tsx     # Inventario per magazzino
│       └── stock-movements/
│           └── page.tsx              # Movimentazioni
│
├── components/
│   ├── materials/
│   │   ├── material-form-dialog.tsx
│   │   ├── material-selector.tsx
│   │   ├── materials-table.tsx
│   │   └── stock-badge.tsx
│   ├── inventory/
│   │   ├── inventory-table.tsx
│   │   ├── adjust-stock-dialog.tsx
│   │   └── warehouse-selector.tsx
│   └── stock-movements/
│       ├── intake-dialog.tsx
│       ├── output-dialog.tsx
│       ├── transfer-dialog.tsx
│       ├── deliver-to-site-dialog.tsx
│       └── movements-timeline.tsx
│
└── lib/
    ├── api/
    │   ├── materials.ts
    │   ├── inventory.ts
    │   ├── stock-movements.ts
    │   └── warehouses.ts
    └── types/
        └── inventory.ts
```

### React Query Pattern
```tsx
// Fetch con cache
const { data: materials, isLoading } = useQuery({
  queryKey: ['materials', filters],
  queryFn: () => materialsApi.getAll(filters),
  staleTime: 5 * 60 * 1000, // 5 minuti
});

// Mutation con optimistic update
const adjustMutation = useMutation({
  mutationFn: (data) => inventoryApi.adjust(data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['inventory'] });

    // Snapshot previous value
    const previousInventory = queryClient.getQueryData(['inventory']);

    // Optimistically update
    queryClient.setQueryData(['inventory'], (old) => ({
      ...old,
      quantity_available: old.quantity_available + newData.quantity,
    }));

    return { previousInventory };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['inventory'], context.previousInventory);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  },
});
```

### Form Validation con Zod
```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const adjustStockSchema = z.object({
  material_id: z.number().positive(),
  warehouse_id: z.number().positive(),
  quantity: z.number().refine((val) => val !== 0, {
    message: 'La quantità non può essere zero',
  }),
  reason: z.string().min(10, 'Inserisci una motivazione dettagliata').max(500),
  unit_cost: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});

type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;

function AdjustStockDialog() {
  const form = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      quantity: 0,
      reason: '',
    },
  });

  const onSubmit = (data: AdjustStockFormValues) => {
    adjustMutation.mutate(data);
  };

  return <Form {...form}>...</Form>;
}
```

### TypeScript Types
```typescript
// lib/types/inventory.ts
export type MaterialType = 'physical' | 'service' | 'kit';
export type StockMovementType = 'intake' | 'output' | 'transfer' | 'adjustment' | 'site_delivery' | 'site_return';
export type WarehouseType = 'central' | 'site_storage' | 'mobile_truck';

export interface Material {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  product_type: MaterialType;
  standard_cost: number;
  purchase_price: number;
  sale_price: number;
  markup_percentage: number;
  is_rentable: boolean;
  barcode?: string;
  qr_code?: string;
  reorder_level: number;
  reorder_quantity: number;
  lead_time_days: number;
  default_supplier_id?: number;
  default_supplier?: Supplier;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: number;
  material_id: number;
  material: Material;
  warehouse_id: number;
  warehouse: Warehouse;
  quantity_available: number;
  quantity_reserved: number;
  quantity_in_transit: number;
  quantity_free: number; // calculated
  minimum_stock: number;
  maximum_stock?: number;
  is_low_stock: boolean; // calculated
  stock_value: number; // calculated
  last_count_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  code: string;
  material_id: number;
  material: Material;
  warehouse_id: number;
  warehouse: Warehouse;
  type: StockMovementType;
  quantity: number;
  unit_cost: number;
  movement_date: string;
  from_warehouse_id?: number;
  from_warehouse?: Warehouse;
  to_warehouse_id?: number;
  to_warehouse?: Warehouse;
  site_id?: number;
  site?: Site;
  supplier_id?: number;
  supplier?: Supplier;
  user_id: number;
  user: User;
  notes?: string;
  reference_document?: string;
  created_at: string;
  updated_at: string;
}
```

---

## ✅ Best Practices

### Performance
1. **Eager Loading**: Sempre usare `with()` per evitare N+1
   ```php
   Inventory::with(['material', 'warehouse'])->get();
   ```

2. **Pagination**: Default 50 items, max 100
   ```php
   Material::paginate($request->input('per_page', 50));
   ```

3. **Caching**: Cache liste statiche
   ```php
   Cache::remember('material-categories', 3600, function () {
       return Material::distinct()->pluck('category');
   });
   ```

4. **Indexes**: Su colonne frequenti in WHERE
   ```sql
   CREATE INDEX idx_inventory_low_stock ON inventory(warehouse_id, material_id)
   WHERE quantity_available <= minimum_stock;
   ```

### Security
1. **Authorization**: Policy per ogni risorsa
2. **Validation**: Form Request per ogni input
3. **Sanitization**: API Resources per output
4. **Rate Limiting**: 60 req/min per user

### Testing
```php
// tests/Feature/InventoryTest.php
it('can adjust stock with valid data', function () {
    $user = User::factory()->create();
    $material = Material::factory()->create();
    $warehouse = Warehouse::factory()->create();

    $inventory = Inventory::factory()->create([
        'material_id' => $material->id,
        'warehouse_id' => $warehouse->id,
        'quantity_available' => 100,
    ]);

    $response = $this->actingAs($user)
        ->postJson('/api/v1/inventory/adjust', [
            'material_id' => $material->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 50,
            'reason' => 'Rettifica inventario fisico',
        ]);

    $response->assertSuccessful();

    expect($inventory->fresh()->quantity_available)->toBe(150);
});
```

---

## 📅 Timeline Suggerita

### Sprint 1 (1 settimana) - Backend Core
- [x] Models & Migrations (FATTO)
- [ ] InventoryController (3 giorni)
- [ ] StockMovementController (2 giorni)
- [ ] InventoryService (2 giorni)

### Sprint 2 (1 settimana) - Backend CRUD
- [ ] MaterialController (2 giorni)
- [ ] WarehouseController (1 giorno)
- [ ] Policies & Authorization (1 giorno)
- [ ] API Tests (3 giorni)

### Sprint 3 (1 settimana) - Frontend Base
- [ ] Materials page (2 giorni)
- [ ] Inventory page (2 giorni)
- [ ] Stock Movements page (3 giorni)

### Sprint 4 (1 settimana) - Integration
- [ ] Dialogs & Forms (3 giorni)
- [ ] Real-time updates (2 giorni)
- [ ] Integration tests (2 giorni)

### Sprint 5+ (Future) - Advanced
- [ ] Barcode/QR
- [ ] Kit Management
- [ ] Rental Management
- [ ] Purchase Orders

---

## 🎯 Priorità

### 🔥 CRITICAL (Da fare subito)
1. InventoryController con query base
2. StockMovementController (intake, output, transfer)
3. Frontend Materials page

### ⚡ HIGH (Importante)
4. InventoryService con business logic
5. Low stock alerts
6. Frontend Inventory & Movements pages

### 📌 MEDIUM (Utile)
7. Barcode/QR generation
8. Purchase Orders
9. Advanced reports

### 🌟 LOW (Nice to have)
10. Kit Management
11. Rental Management
12. Mobile app integration

---

## 📚 Riferimenti

- [Laravel Best Practices](https://github.com/alexeymezenin/laravel-best-practices)
- [Construction Inventory Management](https://www.procore.com/library/inventory-management)
- [ERP Warehouse Best Practices](https://www.opensourceintegrators.com/publications/comprehensive-guide-construction-erp-modules)

---

**Ultima modifica**: 2026-01-09
**Versione**: 1.0
**Stato**: In Progress - 30% completato
