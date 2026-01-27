# Warehouse Module Refactor Checklist
## Material → Product Migration & Pattern Implementation

**Created**: 23 January 2026  
**Purpose**: Complete checklist for finishing Warehouse/Inventory/DDT module implementation  
**Status**: 🚧 In Progress - After Material → Product Refactor  

---

## 📊 CURRENT STATUS OVERVIEW

### ✅ **What's Working**
- ✅ Database migrations completed (material_id → product_id in inventory, stock_movements, ddt_items)
- ✅ Warehouse model updated (relationships use Inventory, StockMovement correctly)
- ✅ Warehouse CRUD (Actions pattern implemented)
- ✅ Warehouse frontend (list, detail, create pages)
- ✅ DDT backend structure (models, service, policy)
- ✅ DDT types & status enums
- ✅ Stock movement logic in DdtService

### ❌ **Critical Issues Found**
1. ❌ **StockMovement model still uses `material_id`** (should be `product_id`)
2. ❌ **DdtItem model still uses `material_id`** (should be `product_id`)
3. ❌ **InventoryService still uses Material model** (should be Product)
4. ❌ **DdtService still uses Material references** (should be Product)
5. ❌ **InventoryController uses `material_id`** (should be `product_id`)
6. ❌ **StockMovementController uses `material_id`** (should be `product_id`)
7. ❌ **StoreDdtRequest validation uses `material_id`** (should be `product_id`)
8. ❌ **UpdateDdtRequest validation uses `material_id`** (should be `product_id`)
9. ❌ **No Spatie Data DTOs for Inventory/StockMovement/DDT** (violates architecture)
10. ❌ **No Actions pattern for Inventory/StockMovement/DDT** (violates architecture)
11. ❌ **Services doing database operations** (should be Actions)
12. ❌ **Frontend: No Inventory pages** (only placeholder)
13. ❌ **Frontend: No StockMovement pages**
14. ❌ **Frontend: No DDT pages**

### 🟡 **Missing Features**
- 🟡 Edit DDT functionality (marked as high priority in TODO)
- 🟡 DDT PDF generation
- 🟡 Stock count/physical inventory
- 🟡 Low stock alerts (event exists, listener missing integration)
- 🟡 Inventory valuation reports
- 🟡 Stock movement reports

---

## 🎯 REFACTOR STRATEGY

**Implementation Order**: Backend → Testing → Frontend (Strategy B)

### **Event-Driven Architecture** 🔔
Modules communicate through **Events + Listeners** (NOT direct Action calls):
- Actions dispatch Events
- Listeners react to Events
- **Example**: `ConfirmDdtAction` dispatches `DdtConfirmed` event → `GenerateStockMovementsListener` listens and creates movements
- **Benefit**: Loose coupling, easy to extend, testable

### Phase 1: Fix Backend Models & Relationships (CRITICAL)
### Phase 2: Implement Spatie Data DTOs (Architecture Compliance)
### Phase 3: Implement Events & Listeners (Event-Driven Architecture)
### Phase 4: Implement Query Classes (Complex Reads)
### Phase 5: Implement Actions Pattern (Business Logic)
### Phase 6: Refactor Services (Remove DB operations, keep utilities)
### Phase 7: Update Controllers (Use DTOs + Actions)
### Phase 8: Backend Testing (Unit + Integration)
### Phase 9: Frontend Implementation
### Phase 10: Frontend Testing

---

## 📋 DETAILED CHECKLIST

---

## **PHASE 1: Backend Models & Relationships** 🔴

### 1.1 StockMovement Model ❌
**Priority**: CRITICAL  
**File**: `/backend/app/Models/StockMovement.php`

**Current Issues**:
```php
'material_id',           // ❌ Should be product_id
'from_warehouse_id',
'to_warehouse_id',

public function material(): BelongsTo  // ❌ Should be product()
{
    return $this->belongsTo(Material::class);  // ❌ Should be Product::class
}
```

**Tasks**:
- [x] Replace `material_id` with `product_id` in fillable array
- [x] Rename `material()` relationship to `product()`
- [x] Change `Material::class` to `Product::class`
- [x] Update all references to `->material` to `->product`
- [x] Update scopes/accessors if they reference material
- [x] Verify `StockMovement::generateCode()` exists (referenced in DdtService)

---

### 1.2 DdtItem Model ❌
**Priority**: CRITICAL  
**File**: `/backend/app/Models/DdtItem.php`

**Current Issues**:
```php
'material_id',  // ❌ Should be product_id

public function material(): BelongsTo  // ❌ Should be product()
{
    return $this->belongsTo(Material::class);  // ❌ Should be Product::class
}
```

**Tasks**:
- [x] Replace `material_id` with `product_id` in fillable array
- [x] Rename `material()` relationship to `product()`
- [x] Change `Material::class` to `Product::class`
- [x] Update all references to `->material` to `->product`

---

### 1.3 Inventory Model ✅ PARTIAL
**Priority**: HIGH  
**File**: `/backend/app/Models/Inventory.php`

**Current Status**: Model already updated with product_id  
**Additional Tasks**:
- [x] Verify all accessors use `->product` (not `->material`)
- [x] Check business methods (reserve, release, addStock, removeStock)
- [x] Verify relationship eager loading works

---

### 1.4 Ddt Model ✅ PARTIAL
**Priority**: MEDIUM  
**File**: `/backend/app/Models/Ddt.php`

**Current Status**: Model structure looks good  
**Tasks**:
- [x] Verify `items` relationship loads DdtItem with product
- [x] Check scopes/accessors
- [x] Verify `canBeConfirmed()`, `canBeCancelled()` methods exist

---

## **PHASE 2: Spatie Data DTOs** 🔴

### 2.1 InventoryData DTO ❌
**Priority**: CRITICAL  
**File**: `/backend/app/Data/InventoryData.php` (CREATE)

**Requirements** (from AI_ARCHITECTURE_RULES.md):
- Use Spatie LaravelData
- Input validation (Required, Min, Max, etc.)
- Output transformation (TypedDataResource trait)
- Lazy relationships
- TypeScript generation (`php artisan typescript:transform`)

**Structure**:
```php
<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

#[TypeScript]
class InventoryData extends Data
{
    public function __construct(
        public int|Optional $id,
        
        #[Required, Exists('products', 'id')]
        public int $product_id,
        
        #[Required, Exists('warehouses', 'id')]
        public int $warehouse_id,
        
        #[Min(0)]
        public float $quantity_available,
        
        #[Min(0)]
        public float $quantity_reserved,
        
        #[Min(0)]
        public float $quantity_in_transit,
        
        #[Min(0)]
        public float $quantity_quarantine,
        
        #[Min(0)]
        public ?float $minimum_stock,
        
        #[Min(0)]
        public ?float $maximum_stock,
        
        public ?string $last_count_date,
        
        // Relationships
        public Lazy|ProductData|null $product,
        public Lazy|WarehouseData|null $warehouse,
        
        // Computed
        public Lazy|float|null $quantity_free,
        public Lazy|bool|null $is_low_stock,
        public Lazy|float|null $stock_value,
        
        // Timestamps
        public Lazy|string|null $created_at,
        public Lazy|string|null $updated_at,
    ) {}
}
```

**Tasks**:
- [x] Create `InventoryData.php`
- [x] Add validation attributes
- [x] Add Lazy relationships
- [x] Add computed properties (quantity_free, is_low_stock, stock_value)
- [x] Run `php artisan typescript:transform`
- [x] Verify TypeScript types generated

---

### 2.2 StockMovementData DTO ✅
**Priority**: CRITICAL
**File**: `/backend/app/Data/StockMovementData.php` (CREATED)

**Structure**:
```php
<?php

namespace App\Data;

use App\Enums\StockMovementType;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

#[TypeScript]
class StockMovementData extends Data
{
    public function __construct(
        public int|Optional $id,
        public string|Optional $code,
        
        public ?int $ddt_id,
        
        #[Required, Exists('products', 'id')]
        public int $product_id,
        
        #[Required, Exists('warehouses', 'id')]
        public int $warehouse_id,
        
        #[Required, Enum(StockMovementType::class)]
        public StockMovementType $type,
        
        #[Required, Min(0.01)]
        public float $quantity,
        
        #[Min(0)]
        public ?float $unit_cost,
        
        #[Required]
        public string $movement_date,
        
        public ?int $from_warehouse_id,
        public ?int $to_warehouse_id,
        public ?int $site_id,
        public ?int $supplier_id,
        public ?string $supplier_document,
        public ?int $user_id,
        public ?string $notes,
        public ?string $reference_document,
        
        // Relationships
        public Lazy|ProductData|null $product,
        public Lazy|WarehouseData|null $warehouse,
        public Lazy|WarehouseData|null $from_warehouse,
        public Lazy|WarehouseData|null $to_warehouse,
        public Lazy|null $site, // SiteData when created
        public Lazy|SupplierData|null $supplier,
        public Lazy|UserData|null $user,
        public Lazy|null $ddt, // DdtData when created
        
        // Timestamps
        public Lazy|string|null $created_at,
        public Lazy|string|null $updated_at,
    ) {}
}
```

**Tasks**:
- [x] Create `StockMovementData.php`
- [x] Add validation attributes
- [x] Add Lazy relationships
- [x] Handle StockMovementType enum
- [x] Run `php artisan typescript:transform`

---

### 2.3 DdtItemData DTO ✅
**Priority**: CRITICAL
**File**: `/backend/app/Data/DdtItemData.php` (CREATED)

**Structure**:
```php
<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

#[TypeScript]
class DdtItemData extends Data
{
    public function __construct(
        public int|Optional $id,
        
        #[Required, Exists('ddts', 'id')]
        public int $ddt_id,
        
        #[Required, Exists('products', 'id')]
        public int $product_id,
        
        #[Required, Min(0.01)]
        public float $quantity,
        
        #[Required]
        public string $unit,
        
        #[Min(0)]
        public ?float $unit_cost,
        
        public ?string $notes,
        
        // Relationships
        public Lazy|ProductData|null $product,
        
        // Computed
        public Lazy|float|null $total_cost,
        
        // Timestamps
        public Lazy|string|null $created_at,
        public Lazy|string|null $updated_at,
    ) {}
}
```

**Tasks**:
- [x] Create `DdtItemData.php`
- [x] Add validation attributes
- [x] Add Lazy relationships
- [x] Add computed total_cost
- [x] Run `php artisan typescript:transform`

---

### 2.4 DdtData DTO ✅
**Priority**: CRITICAL
**File**: `/backend/app/Data/DdtData.php` (CREATED)

**Structure**:
```php
<?php

namespace App\Data;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Enums\ReturnReason;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\DataCollection;

#[TypeScript]
class DdtData extends Data
{
    public function __construct(
        public int|Optional $id,
        public string|Optional $code,
        
        #[Required, Enum(DdtType::class)]
        public DdtType $type,
        
        public ?int $supplier_id,
        public ?int $customer_id,
        public ?int $site_id,
        
        #[Required, Exists('warehouses', 'id')]
        public int $from_warehouse_id,
        
        public ?int $to_warehouse_id,
        
        #[Required]
        public string $ddt_number,
        
        #[Required]
        public string $ddt_date,
        
        public ?string $transport_date,
        public ?string $delivered_at,
        public ?string $carrier_name,
        public ?string $tracking_number,
        public ?string $rental_start_date,
        public ?string $rental_end_date,
        public ?string $rental_actual_return_date,
        public ?int $parent_ddt_id,
        
        #[Enum(ReturnReason::class)]
        public ?ReturnReason $return_reason,
        
        public ?string $return_notes,
        
        #[Enum(DdtStatus::class)]
        public DdtStatus $status,
        
        public ?string $notes,
        public ?int $created_by,
        
        // Relationships
        public Lazy|SupplierData|null $supplier,
        public Lazy|null $customer, // CustomerData when created
        public Lazy|null $site, // SiteData when created
        public Lazy|WarehouseData|null $from_warehouse,
        public Lazy|WarehouseData|null $to_warehouse,
        public Lazy|UserData|null $created_by_user,
        
        /** @var DataCollection<DdtItemData>|null */
        public Lazy|DataCollection|null $items,
        
        /** @var DataCollection<StockMovementData>|null */
        public Lazy|DataCollection|null $stock_movements,
        
        // Timestamps
        public Lazy|string|null $created_at,
        public Lazy|string|null $updated_at,
        public Lazy|string|null $deleted_at,
    ) {}
}
```

**Tasks**:
- [x] Create `DdtData.php`
- [x] Add validation attributes
- [x] Add Lazy relationships
- [x] Handle DdtType, DdtStatus, ReturnReason enums
- [x] Add DataCollection for items and stock_movements
- [x] Run `php artisan typescript:transform`

---

## **PHASE 3: Events & Listeners** 🔴

### 3.1 Inventory Events ❌
**Priority**: CRITICAL  
**Directory**: `/backend/app/Events/` (CREATE)

**Events to Create**:

1. **`InventoryAdjusted.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryAdjusted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Inventory $inventory,
        public readonly StockMovement $movement,
        public readonly float $oldQuantity,
        public readonly float $newQuantity,
        public readonly ?int $userId = null
    ) {}
}
```

2. **`InventoryLowStock.php`** ✅ EXISTS (enhance)
   - Already exists, verify implementation
   - Add more context if needed

3. **`InventoryReserved.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryReserved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Inventory $inventory,
        public readonly float $quantity,
        public readonly ?int $siteId = null,
        public readonly ?int $userId = null
    ) {}
}
```

4. **`InventoryReservationReleased.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryReservationReleased
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Inventory $inventory,
        public readonly float $quantity,
        public readonly ?int $siteId = null,
        public readonly ?int $userId = null
    ) {}
}
```

**Tasks**:
- [x] Create InventoryAdjusted event
- [x] Verify InventoryLowStock event (already exists)
- [x] Create InventoryReserved event
- [x] Create InventoryReservationReleased event
- [x] Add broadcasting channels if needed (real-time)

---

### 3.2 StockMovement Events ❌
**Priority**: CRITICAL  
**Directory**: `/backend/app/Events/` (CREATE)

**Events to Create**:

1. **`StockMovementCreated.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\StockMovement;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockMovementCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly StockMovement $movement
    ) {}
}
```

2. **`StockMovementReversed.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\StockMovement;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockMovementReversed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly StockMovement $originalMovement,
        public readonly StockMovement $reversingMovement,
        public readonly string $reason
    ) {}
}
```

**Tasks**:
- [x] Create StockMovementCreated event
- [x] Create StockMovementReversed event

---

### 3.3 DDT Events ❌
**Priority**: CRITICAL  
**Directory**: `/backend/app/Events/` (CREATE)

**Events to Create**:

1. **`DdtCreated.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DdtCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly ?int $userId = null
    ) {}
}
```

2. **`DdtUpdated.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DdtUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly array $changes,
        public readonly ?int $userId = null
    ) {}
}
```

3. **`DdtConfirmed.php`** ❌ **MOST IMPORTANT**
```php
<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DdtConfirmed Event
 * 
 * Triggered when DDT status changes to Issued.
 * 
 * Listeners:
 * - GenerateStockMovementsListener → Creates stock movements based on DDT type
 * - NotifyWarehouseManagerListener → Sends notification
 * - LogDdtConfirmationListener → Audit trail
 */
class DdtConfirmed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly ?int $userId = null
    ) {}
}
```

4. **`DdtCancelled.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DdtCancelled Event
 * 
 * Triggered when DDT status changes to Cancelled.
 * 
 * Listeners:
 * - ReverseStockMovementsListener → Reverses all stock movements
 * - NotifyWarehouseManagerListener → Sends notification
 * - LogDdtCancellationListener → Audit trail
 */
class DdtCancelled
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly string $reason,
        public readonly ?int $userId = null
    ) {}
}
```

5. **`DdtDelivered.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DdtDelivered Event
 * 
 * Triggered when DDT is marked as delivered.
 * 
 * Listeners:
 * - UpdateSiteMaterialsListener → Updates site_materials table (for outgoing to sites)
 * - NotifyRecipientListener → Sends delivery notification
 * - LogDdtDeliveryListener → Audit trail
 */
class DdtDelivered
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly string $deliveredAt,
        public readonly ?int $userId = null
    ) {}
}
```

6. **`DdtDeleted.php`** ❌
```php
<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DdtDeleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int $ddtId,
        public readonly string $ddtCode,
        public readonly ?int $userId = null
    ) {}
}
```

**Tasks**:
- [x] Create DdtCreated event
- [x] Create DdtUpdated event
- [x] Create DdtConfirmed event (CRITICAL for stock movements)
- [x] Create DdtCancelled event (CRITICAL for reversing movements)
- [x] Create DdtDelivered event (CRITICAL for site materials)
- [x] Create DdtDeleted event

---

### 3.4 Event Listeners ❌
**Priority**: CRITICAL  
**Directory**: `/backend/app/Listeners/` (CREATE)

**Listeners to Create**:

#### Inventory Listeners:

1. **`LogInventoryAdjustmentListener.php`** ❌
   - Listen to: `InventoryAdjusted`
   - Action: Log to audit trail
   - Queue: Yes (ShouldQueue)

2. **`SendLowStockAlertListener.php`** ✅ EXISTS (verify)
   - Listen to: `InventoryLowStock`
   - Action: Send email/notification to warehouse manager
   - Queue: Yes (ShouldQueue)

3. **`LogInventoryReservationListener.php`** ❌
   - Listen to: `InventoryReserved`, `InventoryReservationReleased`
   - Action: Log reservations for tracking
   - Queue: Yes (ShouldQueue)

#### StockMovement Listeners:

4. **`CheckLowStockAfterMovementListener.php`** ❌
   - Listen to: `StockMovementCreated`
   - Action: Check if inventory is low after movement, dispatch `InventoryLowStock` if needed
   - Queue: No (synchronous check)

5. **`LogStockMovementListener.php`** ❌
   - Listen to: `StockMovementCreated`, `StockMovementReversed`
   - Action: Audit trail for movements
   - Queue: Yes (ShouldQueue)

#### DDT Listeners (MOST IMPORTANT):

6. **`GenerateStockMovementsListener.php`** ❌ **CRITICAL**
   - Listen to: `DdtConfirmed`
   - Action: Generate stock movements based on DDT type (intake, outgoing, internal, rental, return)
   - Queue: No (synchronous, must succeed before response)
   - Logic:
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
     ```

7. **`ReverseStockMovementsListener.php`** ❌ **CRITICAL**
   - Listen to: `DdtCancelled`
   - Action: Reverse all stock movements generated by this DDT
   - Queue: No (synchronous, must succeed before response)
   - Logic:
     ```php
     public function handle(DdtCancelled $event): void
     {
         $ddt = $event->ddt;
         
         foreach ($ddt->stockMovements as $movement) {
             // Reverse inventory changes
             // Create compensating movement
             // Mark original movement as reversed
         }
     }
     ```

8. **`UpdateSiteMaterialsListener.php`** ❌ **CRITICAL**
   - Listen to: `DdtDelivered`
   - Action: Update `site_materials` table when outgoing DDT to site is delivered
   - Queue: No (synchronous)
   - Logic:
     ```php
     public function handle(DdtDelivered $event): void
     {
         $ddt = $event->ddt;
         
         if ($ddt->type === DdtType::Outgoing && $ddt->site_id) {
             foreach ($ddt->items as $item) {
                 // Update or create site_materials record
                 SiteMaterial::updateOrCreate([
                     'site_id' => $ddt->site_id,
                     'product_id' => $item->product_id,
                 ], [
                     'quantity_delivered' => DB::raw("quantity_delivered + {$item->quantity}"),
                 ]);
             }
         }
     }
     ```

9. **`NotifyWarehouseManagerListener.php`** ❌
   - Listen to: `DdtConfirmed`, `DdtCancelled`, `DdtDelivered`
   - Action: Send notification to warehouse manager
   - Queue: Yes (ShouldQueue)

10. **`LogDdtActivityListener.php`** ❌
    - Listen to: All DDT events
    - Action: Audit trail for DDT lifecycle
    - Queue: Yes (ShouldQueue)

**Tasks**:
- [x] Create LogInventoryAdjustmentListener
- [x] Verify SendLowStockAlertListener (already exists)
- [x] Create LogInventoryReservationListener
- [x] Create CheckLowStockAfterMovementListener
- [x] Create LogStockMovementListener
- [x] Create GenerateStockMovementsListener (CRITICAL - contains business logic from DdtService)
- [x] Create ReverseStockMovementsListener (CRITICAL - reverse stock movements)
- [x] Create UpdateSiteMaterialsListener (CRITICAL - update site materials)
- [x] Create NotifyWarehouseManagerListener
- [x] Create LogDdtActivityListener
- [x] Register all listeners in EventServiceProvider

---

### 3.5 EventServiceProvider Configuration ❌
**Priority**: CRITICAL  
**File**: `/backend/app/Providers/EventServiceProvider.php`

**Tasks**:
- [x] Register all event-listener mappings
```php
protected $listen = [
    // Inventory Events
    InventoryAdjusted::class => [
        LogInventoryAdjustmentListener::class,
    ],
    InventoryLowStock::class => [
        SendLowStockAlertListener::class,
    ],
    InventoryReserved::class => [
        LogInventoryReservationListener::class,
    ],
    InventoryReservationReleased::class => [
        LogInventoryReservationListener::class,
    ],
    
    // StockMovement Events
    StockMovementCreated::class => [
        CheckLowStockAfterMovementListener::class,
        LogStockMovementListener::class,
    ],
    StockMovementReversed::class => [
        LogStockMovementListener::class,
    ],
    
    // DDT Events
    DdtCreated::class => [
        LogDdtActivityListener::class,
    ],
    DdtUpdated::class => [
        LogDdtActivityListener::class,
    ],
    DdtConfirmed::class => [
        GenerateStockMovementsListener::class, // MUST run first
        NotifyWarehouseManagerListener::class,
        LogDdtActivityListener::class,
    ],
    DdtCancelled::class => [
        ReverseStockMovementsListener::class, // MUST run first
        NotifyWarehouseManagerListener::class,
        LogDdtActivityListener::class,
    ],
    DdtDelivered::class => [
        UpdateSiteMaterialsListener::class, // MUST run first
        NotifyWarehouseManagerListener::class,
        LogDdtActivityListener::class,
    ],
    DdtDeleted::class => [
        LogDdtActivityListener::class,
    ],
];
```

---

## **PHASE 4: Query Classes** 🔴

### 4.1 Inventory Query Classes ❌
**Priority**: HIGH  
**Directory**: `/backend/app/Queries/Inventory/` (CREATE)

**Query Classes to Create**:

1. **`GetInventoryQuery.php`** ❌
```php
<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

readonly class GetInventoryQuery
{
    public function __construct(
        private ?int $warehouseId = null,
        private ?int $productId = null,
        private ?bool $lowStock = null,
        private ?string $search = null,
    ) {}

    public function execute(): Collection
    {
        $query = Inventory::query()
            ->with(['product.category', 'warehouse']);

        if ($this->warehouseId) {
            $query->where('warehouse_id', $this->warehouseId);
        }

        if ($this->productId) {
            $query->where('product_id', $this->productId);
        }

        if ($this->lowStock) {
            $query->whereRaw('quantity_available <= minimum_stock');
        }

        if ($this->search) {
            $query->whereHas('product', function ($q) {
                $q->where('name', 'like', "%{$this->search}%")
                  ->orWhere('code', 'like', "%{$this->search}%");
            });
        }

        return $query->get();
    }
}
```

2. **`GetLowStockItemsQuery.php`** ❌
```php
<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

readonly class GetLowStockItemsQuery
{
    public function __construct(
        private ?int $warehouseId = null
    ) {}

    public function execute(): Collection
    {
        $query = Inventory::query()
            ->whereRaw('quantity_available <= minimum_stock')
            ->with(['product.category', 'warehouse'])
            ->orderBy('quantity_available', 'asc');

        if ($this->warehouseId) {
            $query->where('warehouse_id', $this->warehouseId);
        }

        return $query->get();
    }
}
```

3. **`GetInventoryByWarehouseQuery.php`** ❌
```php
<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

readonly class GetInventoryByWarehouseQuery
{
    public function __construct(
        private int $warehouseId
    ) {}

    public function execute(): Collection
    {
        return Inventory::where('warehouse_id', $this->warehouseId)
            ->with(['product.category'])
            ->orderBy('product.name')
            ->get();
    }
}
```

4. **`GetInventoryByProductQuery.php`** ❌
```php
<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

readonly class GetInventoryByProductQuery
{
    public function __construct(
        private int $productId
    ) {}

    public function execute(): Collection
    {
        return Inventory::where('product_id', $this->productId)
            ->with(['warehouse'])
            ->orderBy('warehouse.name')
            ->get();
    }
}
```

5. **`GetStockValuationQuery.php`** ❌
```php
<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;

readonly class GetStockValuationQuery
{
    public function __construct(
        private ?int $warehouseId = null
    ) {}

    public function execute(): array
    {
        $query = Inventory::query()
            ->join('products', 'inventory.product_id', '=', 'products.id');

        if ($this->warehouseId) {
            $query->where('inventory.warehouse_id', $this->warehouseId);
        }

        $result = $query->selectRaw('
            SUM(inventory.quantity_available * products.standard_cost) as total_value,
            SUM(inventory.quantity_available) as total_units,
            COUNT(DISTINCT inventory.product_id) as unique_products,
            SUM(inventory.quantity_reserved) as total_reserved,
            SUM(inventory.quantity_in_transit) as total_in_transit
        ')->first();

        return [
            'total_value' => (float) ($result->total_value ?? 0),
            'total_units' => (float) ($result->total_units ?? 0),
            'unique_products' => (int) ($result->unique_products ?? 0),
            'total_reserved' => (float) ($result->total_reserved ?? 0),
            'total_in_transit' => (float) ($result->total_in_transit ?? 0),
        ];
    }
}
```

**Tasks**:
- [x] Create Queries directory structure
- [x] Implement GetInventoryQuery
- [x] Implement GetLowStockItemsQuery
- [x] Implement GetInventoryByWarehouseQuery
- [x] Implement GetInventoryByProductQuery
- [x] Implement GetStockValuationQuery

---

### 4.2 StockMovement Query Classes ❌
**Priority**: HIGH  
**Directory**: `/backend/app/Queries/StockMovement/` (CREATE)

**Query Classes to Create**:

1. **`GetStockMovementsQuery.php`** ❌
```php
<?php

namespace App\Queries\StockMovement;

use App\Enums\StockMovementType;
use App\Models\StockMovement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class GetStockMovementsQuery
{
    public function __construct(
        private ?int $productId = null,
        private ?int $warehouseId = null,
        private ?int $siteId = null,
        private ?StockMovementType $type = null,
        private ?string $dateFrom = null,
        private ?string $dateTo = null,
        private ?string $search = null,
        private int $perPage = 20,
    ) {}

    public function execute(): LengthAwarePaginator
    {
        $query = StockMovement::query()
            ->with([
                'product.category',
                'warehouse',
                'fromWarehouse',
                'toWarehouse',
                'site',
                'supplier',
                'user',
                'ddt'
            ]);

        if ($this->productId) {
            $query->where('product_id', $this->productId);
        }

        if ($this->warehouseId) {
            $query->where(function ($q) {
                $q->where('warehouse_id', $this->warehouseId)
                  ->orWhere('from_warehouse_id', $this->warehouseId)
                  ->orWhere('to_warehouse_id', $this->warehouseId);
            });
        }

        if ($this->siteId) {
            $query->where('site_id', $this->siteId);
        }

        if ($this->type) {
            $query->where('type', $this->type);
        }

        if ($this->dateFrom) {
            $query->where('movement_date', '>=', $this->dateFrom);
        }

        if ($this->dateTo) {
            $query->where('movement_date', '<=', $this->dateTo);
        }

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('code', 'like', "%{$this->search}%")
                  ->orWhere('reference_document', 'like', "%{$this->search}%")
                  ->orWhere('notes', 'like', "%{$this->search}%");
            });
        }

        return $query->orderBy('movement_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($this->perPage);
    }
}
```

2. **`GetMovementHistoryByProductQuery.php`** ❌
```php
<?php

namespace App\Queries\StockMovement;

use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Collection;

readonly class GetMovementHistoryByProductQuery
{
    public function __construct(
        private int $productId,
        private ?int $limit = null
    ) {}

    public function execute(): Collection
    {
        $query = StockMovement::where('product_id', $this->productId)
            ->with(['warehouse', 'user', 'ddt'])
            ->orderBy('movement_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($this->limit) {
            $query->limit($this->limit);
        }

        return $query->get();
    }
}
```

3. **`GetRentalHistoryQuery.php`** ❌
```php
<?php

namespace App\Queries\StockMovement;

use App\Enums\StockMovementType;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Collection;

readonly class GetRentalHistoryQuery
{
    public function __construct(
        private ?int $productId = null,
        private ?int $siteId = null,
        private bool $activeOnly = false
    ) {}

    public function execute(): Collection
    {
        $query = StockMovement::query()
            ->whereIn('type', [
                StockMovementType::RENTAL_OUT,
                StockMovementType::RENTAL_RETURN
            ])
            ->with(['product', 'site', 'ddt']);

        if ($this->productId) {
            $query->where('product_id', $this->productId);
        }

        if ($this->siteId) {
            $query->where('site_id', $this->siteId);
        }

        if ($this->activeOnly) {
            // Get only rentals that haven't been returned
            $query->where('type', StockMovementType::RENTAL_OUT)
                  ->whereDoesntHave('ddt', function ($q) {
                      $q->whereHas('stockMovements', function ($sq) {
                          $sq->where('type', StockMovementType::RENTAL_RETURN);
                      });
                  });
        }

        return $query->orderBy('movement_date', 'desc')->get();
    }
}
```

**Tasks**:
- [x] Create Queries directory structure
- [x] Implement GetStockMovementsQuery
- [x] Implement GetMovementHistoryByProductQuery
- [x] Implement GetRentalHistoryQuery

---

### 4.3 DDT Query Classes ❌
**Priority**: HIGH  
**Directory**: `/backend/app/Queries/Ddt/` (CREATE)

**Query Classes to Create**:

1. **`GetDdtsQuery.php`** ❌
```php
<?php

namespace App\Queries\Ddt;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Models\Ddt;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class GetDdtsQuery
{
    public function __construct(
        private ?DdtType $type = null,
        private ?DdtStatus $status = null,
        private ?int $warehouseId = null,
        private ?int $siteId = null,
        private ?int $supplierId = null,
        private ?int $customerId = null,
        private ?string $search = null,
        private string $sortBy = 'ddt_date',
        private string $sortOrder = 'desc',
        private int $perPage = 20,
    ) {}

    public function execute(): LengthAwarePaginator
    {
        $query = Ddt::query()
            ->with([
                'supplier',
                'customer',
                'site',
                'fromWarehouse',
                'toWarehouse',
                'items.product',
                'createdBy'
            ]);

        if ($this->type) {
            $query->where('type', $this->type);
        }

        if ($this->status) {
            $query->where('status', $this->status);
        }

        if ($this->warehouseId) {
            $query->where(function ($q) {
                $q->where('from_warehouse_id', $this->warehouseId)
                  ->orWhere('to_warehouse_id', $this->warehouseId);
            });
        }

        if ($this->siteId) {
            $query->where('site_id', $this->siteId);
        }

        if ($this->supplierId) {
            $query->where('supplier_id', $this->supplierId);
        }

        if ($this->customerId) {
            $query->where('customer_id', $this->customerId);
        }

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('code', 'like', "%{$this->search}%")
                  ->orWhere('ddt_number', 'like', "%{$this->search}%")
                  ->orWhere('notes', 'like', "%{$this->search}%");
            });
        }

        return $query->orderBy($this->sortBy, $this->sortOrder)
            ->paginate($this->perPage);
    }
}
```

2. **`GetDdtByIdQuery.php`** ❌
```php
<?php

namespace App\Queries\Ddt;

use App\Models\Ddt;

readonly class GetDdtByIdQuery
{
    public function __construct(
        private int $id
    ) {}

    public function execute(): Ddt
    {
        return Ddt::with([
            'supplier',
            'customer',
            'site',
            'fromWarehouse',
            'toWarehouse',
            'items.product.category',
            'createdBy',
            'stockMovements.product',
            'parentDdt',
        ])->findOrFail($this->id);
    }
}
```

3. **`GetActiveDdtsBySiteQuery.php`** ❌
```php
<?php

namespace App\Queries\Ddt;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Models\Ddt;
use Illuminate\Database\Eloquent\Collection;

readonly class GetActiveDdtsBySiteQuery
{
    public function __construct(
        private int $siteId
    ) {}

    public function execute(): Collection
    {
        return Ddt::where('site_id', $this->siteId)
            ->whereIn('status', [DdtStatus::Issued, DdtStatus::InTransit])
            ->where('type', DdtType::Outgoing)
            ->with(['items.product', 'fromWarehouse'])
            ->orderBy('ddt_date', 'desc')
            ->get();
    }
}
```

4. **`GetPendingRentalReturnsQuery.php`** ❌
```php
<?php

namespace App\Queries\Ddt;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Models\Ddt;
use Illuminate\Database\Eloquent\Collection;

readonly class GetPendingRentalReturnsQuery
{
    public function __construct(
        private ?int $warehouseId = null
    ) {}

    public function execute(): Collection
    {
        $query = Ddt::where('type', DdtType::RentalOut)
            ->whereIn('status', [DdtStatus::Issued, DdtStatus::InTransit, DdtStatus::Delivered])
            ->where(function ($q) {
                $q->whereNull('rental_actual_return_date')
                  ->orWhere('rental_actual_return_date', '>', now());
            })
            ->with(['items.product', 'site', 'fromWarehouse']);

        if ($this->warehouseId) {
            $query->where('from_warehouse_id', $this->warehouseId);
        }

        return $query->orderBy('rental_end_date', 'asc')->get();
    }
}
```

**Tasks**:
- [x] Create Queries directory structure
- [x] Implement GetDdtsQuery
- [x] Implement GetDdtByIdQuery
- [x] Implement GetActiveDdtsBySiteQuery
- [x] Implement GetPendingRentalReturnsQuery

---

## **PHASE 5: Actions Pattern** 🔴

**Architecture Note**: Actions handle business logic + DB operations, then **dispatch Events**. Listeners handle side effects (stock movements, notifications, etc.). Actions DO NOT call other Actions or Services for side effects.

### 5.1 Inventory Actions ❌
**Priority**: CRITICAL  
**Directory**: `/backend/app/Actions/Inventory/` (CREATE)

**Actions to Create**:

1. **`AdjustInventoryAction.php`** ❌
```php
<?php

namespace App\Actions\Inventory;

use App\Data\InventoryData;
use App\Data\StockMovementData;
use App\Enums\StockMovementType;
use App\Events\InventoryAdjusted;
use App\Events\InventoryLowStock;
use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class AdjustInventoryAction
{
    public function execute(InventoryData $data, float $adjustment, ?string $notes = null): StockMovement
    {
        return DB::transaction(function () use ($data, $adjustment, $notes) {
            // Get or create inventory
            $inventory = Inventory::firstOrCreate([
                'product_id' => $data->product_id,
                'warehouse_id' => $data->warehouse_id,
            ], [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
                'quantity_in_transit' => 0,
                'quantity_quarantine' => 0,
            ]);

            $oldQuantity = $inventory->quantity_available;
            
            // Update inventory
            $inventory->quantity_available += $adjustment;
            $inventory->save();

            // Create movement record
            $movement = StockMovement::create([
                'product_id' => $data->product_id,
                'warehouse_id' => $data->warehouse_id,
                'type' => StockMovementType::ADJUSTMENT,
                'quantity' => abs($adjustment),
                'unit_cost' => $data->unit_cost ?? 0,
                'movement_date' => now(),
                'user_id' => auth()->id(),
                'notes' => $notes,
            ]);

            // Dispatch events (listeners will handle side effects)
            InventoryAdjusted::dispatch($inventory, $movement, $oldQuantity, $inventory->quantity_available, auth()->id());
            
            // Check low stock and dispatch event if needed
            if ($inventory->is_low_stock) {
                InventoryLowStock::dispatch($inventory, $inventory->warehouse);
            }

            return $movement;
        });
    }
}
```

2. **`ReserveInventoryAction.php`** ❌
```php
<?php

namespace App\Actions\Inventory;

use App\Events\InventoryReserved;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class ReserveInventoryAction
{
    public function execute(int $productId, int $warehouseId, float $quantity, ?int $siteId = null): bool
    {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $siteId) {
            $inventory = Inventory::where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->lockForUpdate()
                ->firstOrFail();

            // Check availability
            if ($inventory->quantity_free < $quantity) {
                throw new \Exception("Insufficient stock to reserve. Available: {$inventory->quantity_free}");
            }

            // Reserve stock
            $inventory->quantity_reserved += $quantity;
            $inventory->save();

            // Dispatch event
            InventoryReserved::dispatch($inventory, $quantity, $siteId, auth()->id());

            return true;
        });
    }
}
```

3. **`ReleaseInventoryReservationAction.php`** ❌
```php
<?php

namespace App\Actions\Inventory;

use App\Events\InventoryReservationReleased;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class ReleaseInventoryReservationAction
{
    public function execute(int $productId, int $warehouseId, float $quantity, ?int $siteId = null): bool
    {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $siteId) {
            $inventory = Inventory::where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->lockForUpdate()
                ->firstOrFail();

            // Release reservation
            $inventory->quantity_reserved = max(0, $inventory->quantity_reserved - $quantity);
            $inventory->save();

            // Dispatch event
            InventoryReservationReleased::dispatch($inventory, $quantity, $siteId, auth()->id());

            return true;
        });
    }
}
```

**Tasks**:
- [x] Create Actions directory
- [x] Implement AdjustInventoryAction (dispatches InventoryAdjusted + InventoryLowStock events)
- [x] Implement ReserveInventoryAction (dispatches InventoryReserved event)
- [x] Implement ReleaseInventoryReservationAction (dispatches InventoryReservationReleased event)
- [x] All Actions use DB::transaction()
- [x] All Actions dispatch Events (NOT call other Actions/Services)

---

### 5.2 StockMovement Actions ❌
**Priority**: MEDIUM  
**Directory**: `/backend/app/Actions/StockMovement/` (CREATE)

**Note**: Stock movements are primarily created by **GenerateStockMovementsListener** (reacting to DdtConfirmed event). These Actions are for manual operations only.

**Actions to Create**:

1. **`ReverseStockMovementAction.php`** ❌
```php
<?php

namespace App\Actions\StockMovement;

use App\Enums\StockMovementType;
use App\Events\StockMovementReversed;
use App\Models\StockMovement;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class ReverseStockMovementAction
{
    public function execute(int $movementId, string $reason): StockMovement
    {
        return DB::transaction(function () use ($movementId, $reason) {
            $originalMovement = StockMovement::findOrFail($movementId);

            // Create compensating movement
            $reversingMovement = StockMovement::create([
                'product_id' => $originalMovement->product_id,
                'warehouse_id' => $originalMovement->warehouse_id,
                'type' => $this->getOppositeType($originalMovement->type),
                'quantity' => $originalMovement->quantity,
                'unit_cost' => $originalMovement->unit_cost,
                'movement_date' => now(),
                'from_warehouse_id' => $originalMovement->to_warehouse_id,
                'to_warehouse_id' => $originalMovement->from_warehouse_id,
                'user_id' => auth()->id(),
                'notes' => "Reversal of movement {$originalMovement->code}. Reason: {$reason}",
                'reference_document' => "REV-{$originalMovement->code}",
            ]);

            // Update inventory
            $this->reverseInventoryChanges($originalMovement);

            // Dispatch event
            StockMovementReversed::dispatch($originalMovement, $reversingMovement, $reason);

            return $reversingMovement;
        });
    }

    private function getOppositeType(StockMovementType $type): StockMovementType
    {
        return match ($type) {
            StockMovementType::INTAKE => StockMovementType::OUTPUT,
            StockMovementType::OUTPUT => StockMovementType::INTAKE,
            StockMovementType::TRANSFER => StockMovementType::TRANSFER, // Same, but from/to reversed
            default => StockMovementType::ADJUSTMENT,
        };
    }

    private function reverseInventoryChanges(StockMovement $movement): void
    {
        // Implementation depends on movement type
        // For INTAKE: decrease quantity
        // For OUTPUT: increase quantity
        // For TRANSFER: reverse both sides
    }
}
```

**Tasks**:
- [x] Create Actions directory
- [x] Implement ReverseStockMovementAction (dispatches StockMovementReversed event)
- [x] Use DB::transaction()
- [x] NOTE: CreateStockMovementAction NOT needed (done by GenerateStockMovementsListener)

---

### 5.3 DDT Actions ❌
**Priority**: CRITICAL  
**Directory**: `/backend/app/Actions/Ddt/` (CREATE)

**IMPORTANT**: DDT Actions do NOT generate stock movements directly. They dispatch events, and **GenerateStockMovementsListener** creates the movements.

**Actions to Create**:

1. **`CreateDdtAction.php`** ❌
```php
<?php

namespace App\Actions\Ddt;

use App\Data\DdtData;
use App\Enums\DdtStatus;
use App\Events\DdtCreated;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class CreateDdtAction
{
    public function execute(DdtData $data): Ddt
    {
        return DB::transaction(function () use ($data) {
            // Create DDT
            $ddt = Ddt::create([
                ...$data->except('items')->toArray(),
                'status' => DdtStatus::Draft,
                'created_by' => auth()->id(),
            ]);

            // Create items
            if ($data->items) {
                foreach ($data->items as $itemData) {
                    $ddt->items()->create($itemData->toArray());
                }
            }

            // Dispatch event
            DdtCreated::dispatch($ddt, auth()->id());

            return $ddt->fresh(['items.product']);
        });
    }
}
```

2. **`UpdateDdtAction.php`** ❌
```php
<?php

namespace App\Actions\Ddt;

use App\Data\DdtData;
use App\Events\DdtUpdated;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class UpdateDdtAction
{
    public function execute(Ddt $ddt, DdtData $data): Ddt
    {
        // Only Draft can be edited (per confirmed decision)
        if ($ddt->status !== DdtStatus::Draft) {
            throw new \Exception("DDT can only be edited in Draft status. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt, $data) {
            $changes = $ddt->getDirty();

            // Update DDT
            $ddt->update($data->except('items', 'status', 'created_by')->toArray());

            // Sync items
            if ($data->items) {
                $ddt->items()->delete();
                foreach ($data->items as $itemData) {
                    $ddt->items()->create($itemData->toArray());
                }
            }

            // Dispatch event
            DdtUpdated::dispatch($ddt, $changes, auth()->id());

            return $ddt->fresh(['items.product']);
        });
    }
}
```

3. **`DeleteDdtAction.php`** ❌
```php
<?php

namespace App\Actions\Ddt;

use App\Enums\DdtStatus;
use App\Events\DdtDeleted;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class DeleteDdtAction
{
    public function execute(Ddt $ddt): bool
    {
        // Only Draft can be deleted
        if ($ddt->status !== DdtStatus::Draft) {
            throw new \Exception("Only Draft DDTs can be deleted. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt) {
            $ddtId = $ddt->id;
            $ddtCode = $ddt->code;

            $ddt->delete(); // Soft delete

            // Dispatch event
            DdtDeleted::dispatch($ddtId, $ddtCode, auth()->id());

            return true;
        });
    }
}
```

4. **`ConfirmDdtAction.php`** ❌ **CRITICAL**
```php
<?php

namespace App\Actions\Ddt;

use App\Enums\DdtStatus;
use App\Events\DdtConfirmed;
use App\Models\Ddt;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class ConfirmDdtAction
{
    public function execute(Ddt $ddt): Ddt
    {
        if ($ddt->status !== DdtStatus::Draft) {
            throw new \Exception("Only Draft DDTs can be confirmed. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt) {
            // Validate items exist
            if ($ddt->items()->count() === 0) {
                throw new \Exception('DDT must have at least one item.');
            }

            // Validate stock availability for outgoing types
            if (in_array($ddt->type, [DdtType::Outgoing, DdtType::Internal, DdtType::RentalOut])) {
                $this->validateStockAvailability($ddt);
            }

            // Update status
            $ddt->update(['status' => DdtStatus::Issued]);

            // Dispatch event - GenerateStockMovementsListener will create movements
            DdtConfirmed::dispatch($ddt, auth()->id());

            return $ddt->fresh(['items', 'stockMovements']);
        });
    }

    private function validateStockAvailability(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            $inventory = Inventory::where('product_id', $item->product_id)
                ->where('warehouse_id', $ddt->from_warehouse_id)
                ->first();

            if (!$inventory || $inventory->quantity_free < $item->quantity) {
                $available = $inventory->quantity_free ?? 0;
                $productName = $item->product->name;
                throw new \Exception("Insufficient stock for {$productName}. Available: {$available}, Required: {$item->quantity}");
            }
        }
    }
}
```

5. **`CancelDdtAction.php`** ❌ **CRITICAL**
```php
<?php

namespace App\Actions\Ddt;

use App\Enums\DdtStatus;
use App\Events\DdtCancelled;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class CancelDdtAction
{
    public function execute(Ddt $ddt, string $reason): Ddt
    {
        if (!in_array($ddt->status, [DdtStatus::Issued, DdtStatus::InTransit])) {
            throw new \Exception("DDT cannot be cancelled. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt, $reason) {
            // Update status
            $ddt->update([
                'status' => DdtStatus::Cancelled,
                'notes' => ($ddt->notes ? $ddt->notes . "\n\n" : '') . "CANCELLED: {$reason}"
            ]);

            // Dispatch event - ReverseStockMovementsListener will reverse movements
            DdtCancelled::dispatch($ddt, $reason, auth()->id());

            return $ddt->fresh(['stockMovements']);
        });
    }
}
```

6. **`DeliverDdtAction.php`** ❌ **CRITICAL**
```php
<?php

namespace App\Actions\Ddt;

use App\Enums\DdtStatus;
use App\Events\DdtDelivered;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class DeliverDdtAction
{
    public function execute(Ddt $ddt): Ddt
    {
        if (!in_array($ddt->status, [DdtStatus::Issued, DdtStatus::InTransit])) {
            throw new \Exception("DDT cannot be delivered. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt) {
            $deliveredAt = now();

            // Update status and delivery date
            $ddt->update([
                'status' => DdtStatus::Delivered,
                'delivered_at' => $deliveredAt
            ]);

            // Dispatch event - UpdateSiteMaterialsListener will update site_materials if needed
            DdtDelivered::dispatch($ddt, $deliveredAt->toISOString(), auth()->id());

            return $ddt;
        });
    }
}
```

**Tasks**:
- [x] Create Actions directory
- [x] Implement CreateDdtAction (dispatches DdtCreated event)
- [x] Implement UpdateDdtAction (dispatches DdtUpdated event, only Draft)
- [x] Implement DeleteDdtAction (dispatches DdtDeleted event, only Draft)
- [x] Implement ConfirmDdtAction (dispatches DdtConfirmed event → GenerateStockMovementsListener creates movements)
- [x] Implement CancelDdtAction (dispatches DdtCancelled event → ReverseStockMovementsListener reverses movements)
- [x] Implement DeliverDdtAction (dispatches DdtDelivered event → UpdateSiteMaterialsListener updates site_materials)
- [x] Use DdtData DTO for input
- [x] Use DB::transaction() in all Actions
- [x] Actions dispatch Events, NOT call Listeners directly

---

## **PHASE 6: Refactor Services** 🔴

**Architecture Note**: Services should contain ONLY business logic calculations/utilities. NO database operations (reads or writes). Use Query Classes for reads, Actions for writes.

### 6.1 InventoryService ❌
**Priority**: HIGH  
**File**: `/backend/app/Services/InventoryService.php`

**Current Issues**:
- ❌ Uses Material model (should be Product)
- ❌ Has DB read operations (should use Query Classes)
- ❌ Has DB write operations (should be in Actions)

**Refactor Strategy**:
- ❌ REMOVE ALL: Query methods → Move to Query Classes
- ❌ REMOVE ALL: Write methods → Already in Actions
- ✅ KEEP ONLY: Utility/calculation methods (if any exist)
- 🎯 RESULT: Potentially DELETE entire service if no utilities remain

**New Approach**:
```php
<?php

namespace App\Services;

use App\Queries\Inventory\GetStockValuationQuery;

/**
 * InventoryService
 * 
 * Contains ONLY business logic calculations for inventory.
 * NO database operations (use Query Classes for reads, Actions for writes).
 */
class InventoryService
{
    /**
     * Calculate reorder quantity based on min/max and current stock
     */
    public function calculateReorderQuantity(float $currentStock, float $minStock, float $maxStock): float
    {
        if ($currentStock >= $minStock) {
            return 0;
        }

        return max(0, $maxStock - $currentStock);
    }

    /**
     * Calculate days of stock remaining based on average daily usage
     */
    public function calculateDaysOfStock(float $currentStock, float $averageDailyUsage): float
    {
        if ($averageDailyUsage <= 0) {
            return PHP_FLOAT_MAX;
        }

        return $currentStock / $averageDailyUsage;
    }

    // Add other utility methods as needed
    // NO database queries here!
}
```

**Tasks**:
- [x] Remove getAll() → Controllers use GetInventoryQuery directly
- [x] Remove getByWarehouse() → Controllers use GetInventoryByWarehouseQuery
- [x] Remove getByMaterial() → Controllers use GetInventoryByProductQuery
- [x] Remove getLowStockItems() → Controllers use GetLowStockItemsQuery
- [x] Remove getStockValuation() → Controllers use GetStockValuationQuery
- [x] Remove adjustStock() → Already AdjustInventoryAction
- [x] Remove intakeStock() → Not needed (done by GenerateStockMovementsListener)
- [x] Remove outputStock() → Not needed (done by GenerateStockMovementsListener)
- [x] Remove transferStock() → Not needed (done by GenerateStockMovementsListener)
- [x] Remove reserveForSite() → Already ReserveInventoryAction
- [x] Remove releaseReservation() → Already ReleaseInventoryReservationAction
- [x] KEEP ONLY: Calculation/utility methods (if any)
- [x] Consider deleting entire service if empty
- [x] Replace all `->material` with `->product`
- [x] Remove write methods (move to Actions)
- [x] Keep only query methods
- [x] Update to use InventoryData DTO for output
- [x] Add Query Classes for complex reads (if needed)

---

### 4.2 DdtService ❌
**Priority**: HIGH  
**File**: `/backend/app/Services/DdtService.php`

**Current Issues**:
- ❌ Uses Material model (should be Product)
- ❌ Has DB write operations (should be in Actions)
- ❌ Methods like `create()`, `update()`, `confirmAndProcess()` should be Actions

**Refactor Strategy**:
- ✅ KEEP: Query methods (getAll, getById)
- ❌ REMOVE: Write operations (create, update, delete, confirmAndProcess, cancel, etc.)
- ✅ MOVE: Write operations → Actions
- ✅ KEEP: Process methods (processIncoming, processOutgoing, etc.) → Move to ConfirmDdtAction

**Tasks**:
- [x] Replace all `Material` references with `Product`
- [x] Replace all `material_id` with `product_id`
- [x] Replace all `->material` with `->product`
- [x] Remove write methods (move to Actions)
- [x] Keep only query methods (getAll, getById)
- [x] Move process methods to ConfirmDdtAction
- [x] Update to use DdtData DTO for output

---

## **PHASE 5: Update Controllers** 🔴

### 5.1 InventoryController ❌
**Priority**: HIGH  
**File**: `/backend/app/Http/Controllers/Api/V1/InventoryController.php`

**Current Issues**:
- ❌ Uses `material_id` (should be `product_id`)
- ❌ Validates `material_id` (should use InventoryData DTO)
- ❌ Calls InventoryService write methods (should call Actions)

**Refactor Strategy**:
```php
class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly AdjustInventoryAction $adjustInventoryAction,
        private readonly ReserveInventoryAction $reserveInventoryAction,
        private readonly ReleaseInventoryReservationAction $releaseInventoryReservationAction,
    ) {}
    
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);
        $filters = $request->only(['warehouse_id', 'product_id', 'low_stock', 'search']);
        $inventory = $this->inventoryService->getAll($filters);
        return response()->json([
            'success' => true,
            'data' => InventoryData::collect($inventory, DataCollection::class),
        ]);
    }
    
    public function adjust(Request $request): JsonResponse
    {
        $this->authorize('create', Inventory::class);
        $data = InventoryData::from($request);
        $movement = $this->adjustInventoryAction->execute($data);
        return response()->json([
            'success' => true,
            'message' => 'Stock adjusted successfully',
            'data' => StockMovementData::from($movement),
        ]);
    }
}
```

**Tasks**:
- [x] Replace `material_id` with `product_id` in all methods
- [x] Replace validation rules with InventoryData::from($request)
- [x] Inject Actions in constructor
- [x] Call Actions instead of Service write methods
- [x] Return InventoryData/StockMovementData instead of Resources
- [x] Update all endpoints (adjust, updateMinimumStock, updateMaximumStock, etc.)

---

### 5.2 StockMovementController ❌
**Priority**: HIGH  
**File**: `/backend/app/Http/Controllers/Api/V1/StockMovementController.php`

**Current Issues**:
- ❌ Uses `material_id` (should be `product_id`)
- ❌ Validates `material_id` (should use StockMovementData DTO)
- ❌ Calls InventoryService write methods (should call Actions)

**Refactor Strategy**:
```php
class StockMovementController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly CreateStockMovementAction $createStockMovementAction,
    ) {}
    
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockMovement::class);
        $filters = $request->only(['product_id', 'warehouse_id', 'site_id', 'type', 'date_from', 'date_to']);
        $movements = $this->inventoryService->getMovementHistory($filters);
        return response()->json([
            'success' => true,
            'data' => StockMovementData::collect($movements, DataCollection::class),
        ]);
    }
    
    public function intake(Request $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);
        $data = StockMovementData::from([
            ...$request->all(),
            'type' => StockMovementType::INTAKE,
        ]);
        $movement = $this->createStockMovementAction->execute($data);
        return response()->json([
            'success' => true,
            'message' => 'Stock intake recorded successfully',
            'data' => StockMovementData::from($movement),
        ], 201);
    }
}
```

**Tasks**:
- [x] Replace `material_id` with `product_id` in all methods
- [x] Replace validation rules with StockMovementData::from($request)
- [x] Inject Actions in constructor
- [x] Call Actions instead of Service write methods
- [x] Return StockMovementData instead of Resources
- [x] Update all endpoints (intake, output, transfer, etc.)

---

### 5.3 DdtController ❌
**Priority**: HIGH  
**File**: `/backend/app/Http/Controllers/Api/V1/DdtController.php`

**Current Issues**:
- ❌ Uses StoreDdtRequest/UpdateDdtRequest (should use DdtData DTO)
- ❌ StoreDdtRequest validates `material_id` (should be `product_id`)
- ❌ Calls DdtService write methods (should call Actions)

**Refactor Strategy**:
```php
class DdtController extends Controller
{
    public function __construct(
        private readonly DdtService $ddtService,
        private readonly CreateDdtAction $createDdtAction,
        private readonly UpdateDdtAction $updateDdtAction,
        private readonly DeleteDdtAction $deleteDdtAction,
        private readonly ConfirmDdtAction $confirmDdtAction,
        private readonly CancelDdtAction $cancelDdtAction,
        private readonly DeliverDdtAction $deliverDdtAction,
    ) {}
    
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Ddt::class);
        $filters = $request->only(['type', 'status', 'warehouse_id', 'site_id', 'search', 'sort_by', 'sort_order']);
        $perPage = $request->input('per_page', 20);
        $ddts = $this->ddtService->getAll($filters, $perPage);
        return response()->json([
            'success' => true,
            'data' => DdtData::collect($ddts, DataCollection::class),
            'meta' => [
                'current_page' => $ddts->currentPage(),
                'last_page' => $ddts->lastPage(),
                'per_page' => $ddts->perPage(),
                'total' => $ddts->total(),
            ],
        ]);
    }
    
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Ddt::class);
        $data = DdtData::from($request);
        $ddt = $this->createDdtAction->execute($data);
        return response()->json([
            'success' => true,
            'message' => 'DDT creato con successo.',
            'data' => DdtData::from($ddt),
        ], 201);
    }
    
    public function confirm(Ddt $ddt): JsonResponse
    {
        $this->authorize('update', $ddt);
        $ddt = $this->confirmDdtAction->execute($ddt);
        return response()->json([
            'success' => true,
            'message' => 'DDT confermato e movimenti generati con successo.',
            'data' => DdtData::from($ddt),
        ]);
    }
}
```

**Tasks**:
- [x] Remove StoreDdtRequest/UpdateDdtRequest (use DdtData DTO instead)
- [x] Replace validation with DdtData::from($request)
- [x] Inject Actions in constructor
- [x] Call Actions instead of Service methods
- [x] Return DdtData instead of DdtResource
- [x] Update all endpoints (store, update, destroy, confirm, cancel, deliver)

---

## **PHASE 6: Frontend Implementation** 🟡

### 6.1 Inventory Pages ❌
**Priority**: HIGH  
**Directory**: `/frontend/app/(dashboard)/inventory/`

**Pages to Create**:
1. **`page.tsx`** - Inventory list/dashboard
   - Table with filters (warehouse, product, low stock)
   - Show: product, warehouse, quantity_available, quantity_reserved, quantity_free, status (low stock)
   - Search by product name/code
   - Actions: Adjust stock, Transfer, View movements
   
2. **`[id]/page.tsx`** - Inventory detail (product in warehouse)
   - Product info
   - Warehouse info
   - Quantity breakdown (available, reserved, in transit, quarantine)
   - Stock history (movements)
   - Adjust stock form
   - Set min/max stock levels

**Components to Create**:
- `inventory-columns.tsx` - DataTable columns
- `inventory-adjust-dialog.tsx` - Adjust stock modal
- `inventory-transfer-dialog.tsx` - Transfer between warehouses
- `inventory-stats.tsx` - Dashboard stats (total value, low stock count, etc.)

**API Integration**:
- Create `lib/api/inventory.ts` with:
  - `getInventory(filters)`
  - `getInventoryByWarehouse(warehouseId)`
  - `getInventoryByProduct(productId)`
  - `getLowStock(warehouseId?)`
  - `getStockValuation(warehouseId?)`
  - `adjustStock(data)`
  - `updateMinimumStock(data)`
  - `updateMaximumStock(data)`

**Tasks**:
- [ ] Create inventory pages
- [ ] Create inventory components
- [ ] Create inventory API client
- [ ] Add inventory types to `lib/types/index.ts`
- [ ] Implement dark mode support
- [ ] Add to navigation menu
- [ ] Test all CRUD operations

---

### 6.2 Stock Movements Pages ❌
**Priority**: MEDIUM  
**Directory**: `/frontend/app/(dashboard)/stock-movements/`

**Pages to Create**:
1. **`page.tsx`** - Stock movements list
   - Table with filters (product, warehouse, type, date range)
   - Show: code, date, type, product, quantity, warehouse, user
   - Search by code/reference
   - Actions: View details, Reverse (if allowed)

**Components to Create**:
- `stock-movement-columns.tsx` - DataTable columns
- `stock-movement-type-badge.tsx` - Movement type badge
- `stock-movement-filters.tsx` - Filter form (date range, type, warehouse)

**API Integration**:
- Create `lib/api/stock-movements.ts` with:
  - `getStockMovements(filters)`
  - `getStockMovementsByProduct(productId)`
  - `getStockMovementsByWarehouse(warehouseId)`
  - `getRentalHistory()`

**Tasks**:
- [ ] Create stock movements pages
- [ ] Create stock movements components
- [ ] Create stock movements API client
- [ ] Add stock movement types to `lib/types/index.ts`
- [ ] Implement dark mode support
- [ ] Add to navigation menu

---

### 6.3 DDT Pages ❌
**Priority**: HIGH  
**Directory**: `/frontend/app/(dashboard)/ddts/`

**Current Status**: Directory exists, no pages

**Pages to Create**:
1. **`page.tsx`** - DDT list
   - Table with filters (type, status, warehouse, site, date range)
   - Show: code, ddt_number, date, type, status, from/to, items count
   - Search by code/number
   - Actions: View, Edit (if draft), Confirm, Cancel, Delete
   
2. **`[id]/page.tsx`** - DDT detail
   - DDT info (type, status, dates, warehouses, etc.)
   - Items table (product, quantity, unit, unit_cost, total)
   - Stock movements generated
   - Transport info (carrier, tracking)
   - Rental info (if applicable)
   - Actions: Edit, Confirm, Cancel, Mark as delivered, Download PDF
   
3. **`new/page.tsx`** - Create DDT
   - Type selection
   - Context selection (supplier/customer/site)
   - Warehouse selection (from/to)
   - Date fields
   - Items table (add/remove rows)
   - Transport info
   - Rental dates (if applicable)
   - Notes
   
4. **`[id]/edit/page.tsx`** - Edit DDT (only if Draft/Issued)
   - Same form as create
   - Load existing data
   - Validate can be edited

**Components to Create**:
- `ddt-form.tsx` - Main DDT form (create/edit)
- `ddt-columns.tsx` - DataTable columns
- `ddt-items-table.tsx` - Items table with add/remove
- `ddt-type-badge.tsx` - Type badge
- `ddt-status-badge.tsx` - Status badge
- `ddt-type-select.tsx` - Type selection with icons
- `ddt-confirm-dialog.tsx` - Confirm action dialog
- `ddt-cancel-dialog.tsx` - Cancel action dialog

**API Integration**:
- Create `lib/api/ddts.ts` with:
  - `getDdts(filters)`
  - `getDdtById(id)`
  - `createDdt(data)`
  - `updateDdt(id, data)`
  - `deleteDdt(id)`
  - `confirmDdt(id)`
  - `cancelDdt(id)`
  - `deliverDdt(id, deliveredAt)`
  - `generatePdf(id)` (when implemented)

**Tasks**:
- [ ] Create DDT pages (list, detail, create, edit)
- [ ] Create DDT components
- [ ] Create DDT API client
- [ ] Add DDT types to `lib/types/index.ts`
- [ ] Implement dark mode support
- [ ] Add to navigation menu
- [ ] Test all CRUD operations
- [ ] Test confirm/cancel workflows
- [ ] Test stock movements generation

---

## **PHASE 7: Testing & Validation** 🟡

### 7.1 Backend Testing ❌
**Priority**: MEDIUM

**Unit Tests to Create**:
- [x] InventoryData DTO test
- [x] StockMovementData DTO test
- [x] DdtItemData DTO test
- [x] DdtData DTO test
- [x] AdjustInventoryAction test
- [x] CreateStockMovementAction test
- [x] CreateDdtAction test
- [x] ConfirmDdtAction test
- [x] CancelDdtAction test

**Integration Tests to Create**:
- [x] Inventory API endpoints test
- [x] StockMovement API endpoints test
- [x] DDT API endpoints test
- [x] DDT confirmation workflow test
- [x] DDT cancellation workflow test
- [x] Stock movements generation test

**Tasks**:
- [x] Create test factories for Inventory, StockMovement, Ddt, DdtItem
- [x] Write unit tests for DTOs
- [x] Write unit tests for Actions
- [x] Write integration tests for API endpoints
- [x] Write feature tests for workflows
- [x] Run `php artisan test`
- [x] Ensure 100% pass rate

---

### 7.2 Frontend Testing ❌
**Priority**: LOW

**Component Tests**:
- [ ] Inventory list test
- [ ] Inventory adjust dialog test
- [ ] DDT form test
- [ ] DDT items table test
- [ ] Stock movement list test

**E2E Tests** (Playwright):
- [ ] Create DDT flow
- [ ] Confirm DDT flow
- [ ] Adjust inventory flow
- [ ] Transfer stock flow

**Tasks**:
- [ ] Set up Vitest for component tests
- [ ] Set up Playwright for E2E tests
- [ ] Write component tests
- [ ] Write E2E tests
- [ ] Run tests in CI/CD

---

## 📊 PROGRESS TRACKING

### Overall Progress: 50% 🟡

| Phase | Status | Progress | Priority |
|-------|--------|----------|----------|
| Phase 1: Backend Models | ✅ COMPLETED | 4/4 | 🔴 CRITICAL |
| Phase 2: Spatie Data DTOs | ✅ COMPLETED | 4/4 | 🔴 CRITICAL |
| Phase 3: Actions Pattern | ❌ Not Started | 0/12 | 🔴 CRITICAL |
| Phase 4: Refactor Services | ❌ Not Started | 0/2 | 🔴 CRITICAL |
| Phase 5: Update Controllers | ❌ Not Started | 0/3 | 🔴 CRITICAL |
| Phase 6: Frontend | ❌ Not Started | 0/3 | 🟡 HIGH |
| Phase 7: Testing | ❌ Not Started | 0/2 | 🟢 MEDIUM |

---

## ⏱️ ESTIMATED TIMELINE

| Phase | Estimated Time | Complexity |
|-------|----------------|------------|
| Phase 1 | 2-3 hours | MEDIUM |
| Phase 2 | 3-4 hours | MEDIUM-HIGH |
| Phase 3 | 6-8 hours | HIGH |
| Phase 4 | 2-3 hours | MEDIUM |
| Phase 5 | 3-4 hours | MEDIUM |
| Phase 6 | 8-12 hours | HIGH |
| Phase 7 | 4-6 hours | MEDIUM |
| **TOTAL** | **28-40 hours** | **HIGH** |

---

## 🚨 CRITICAL BLOCKERS

1. **StockMovement and DdtItem still use Material instead of Product**
   - **Impact**: Breaks after Material model removal
   - **Fix**: Update models, relationships, service references
   - **Time**: 1-2 hours

2. **No Spatie Data DTOs for Warehouse module**
   - **Impact**: Violates architecture rules
   - **Fix**: Create 4 DTOs (Inventory, StockMovement, DdtItem, Ddt)
   - **Time**: 3-4 hours

3. **No Actions pattern for Warehouse module**
   - **Impact**: Violates architecture rules, business logic in Services
   - **Fix**: Create 12 Actions
   - **Time**: 6-8 hours

4. **Frontend pages missing**
   - **Impact**: Cannot use Inventory/DDT features in UI
   - **Fix**: Create pages, components, API clients
   - **Time**: 8-12 hours

---

## 📝 NOTES & DECISIONS

### Design Decisions

1. **Why not keep FormRequest classes?**
   - Architecture mandates Spatie Data for BOTH input validation AND output
   - No separate FormRequest/Resource pattern
   - Consistency with rest of the project

2. **Why move business logic from Services to Actions?**
   - Services should ONLY contain calculations/utilities, NO database operations
   - Actions handle write operations with transactions and events
   - Query Classes handle complex reads
   - Services for business logic utilities (e.g., PriceCalculatorService)

3. **Why create separate Actions for DDT processes?**
   - Single Responsibility Principle
   - Easier to test
   - Easier to reuse (e.g., ConfirmDdtAction can be called from API, CLI, Queue)
   - Better error handling and rollback

### ✅ Decisions Confirmed

1. **Implementation Strategy**: Backend → Testing → Frontend (Strategy B) ✅
   - Complete backend fully before frontend
   - Test backend thoroughly
   - Frontend last (8-12h)

2. **DDT Edit Rules**: DDT CANNOT be modified after confirmation ✅
   - Editable: Draft status only
   - NOT editable: Issued, In Transit, Delivered, Cancelled
   - Type and warehouses IMMUTABLE after creation
   - Reason: Stock movements already generated, cannot be undone

3. **Event-Driven Architecture**: ALL modules communicate via Events ✅
   - Actions dispatch Events
   - Listeners handle side effects
   - NO direct cross-module Action calls
   - Example: `ConfirmDdtAction` → dispatches `DdtConfirmed` → `GenerateStockMovementsListener` creates movements
   - Benefit: Loose coupling, modules independent, easy to extend

4. **Query Classes**: Create for ALL complex queries ✅
   - Move from Services to `app/Queries/Inventory/`, `app/Queries/StockMovement/`, `app/Queries/Ddt/`
   - Pattern: `GetInventoryQuery`, `GetLowStockQuery`, etc.
   - Services keep ONLY calculations/utilities (no database reads)

5. **Events to Implement**: Full audit trail ✅
   - **Inventory Events**:
     - `InventoryAdjusted` - Stock adjusted (manual)
     - `InventoryLowStock` - Under minimum (EXISTS, enhance listener)
     - `InventoryReserved` - Stock reserved
     - `InventoryReservationReleased` - Reservation cancelled
   - **StockMovement Events**:
     - `StockMovementCreated` - Movement recorded
     - `StockMovementReversed` - Movement cancelled/corrected
   - **DDT Events**:
     - `DdtCreated` - DDT created (Draft)
     - `DdtUpdated` - DDT updated (Draft only)
     - `DdtConfirmed` - DDT confirmed (triggers stock movements via listener)
     - `DdtCancelled` - DDT cancelled (reverses movements via listener)
     - `DdtDelivered` - DDT delivered (updates site materials via listener)
     - `DdtDeleted` - DDT deleted (soft delete)

---

## 🔗 RELATED DOCUMENTS

- **Architecture**: `/backend/AI_ARCHITECTURE_RULES.md`
- **Final Architecture**: `/backend/FINAL_ARCHITECTURE.md`
- **Warehouse Refactoring**: `/backend/WAREHOUSE_REFACTORING.md`
- **TODO**: `/TODO.md` (Section 10: DDT Module)
- **Guidelines Index**: `/GUIDELINES_INDEX.md`

---

## 📞 NEXT STEPS

### Immediate Actions (START HERE):
1. Read this checklist completely
2. Read `/backend/AI_ARCHITECTURE_RULES.md` (MANDATORY)
3. Start with Phase 1: Fix backend models
4. Move to Phase 2: Create DTOs
5. Proceed sequentially through phases

### When Completed:
1. Update `/TODO.md` with completion status
2. Update `/GUIDELINES_INDEX.md` if needed
3. Run `./vendor/bin/pint` (backend)
4. Run `php artisan typescript:transform` (generate TS types)
5. Run `npm run lint:fix` (frontend)
6. Test all functionality
7. Mark this checklist as complete ✅

---

**Last Updated**: 23 January 2026  
**Created By**: AI Assistant (Claude Code)  
**Status**: 🚧 Ready for Implementation
