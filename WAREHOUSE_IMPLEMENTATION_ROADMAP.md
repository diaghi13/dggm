# Warehouse Module - Implementation Roadmap

**Date**: 23 January 2026  
**Strategy**: Backend → Testing → Frontend  
**Architecture**: Event-Driven with Query Classes + Actions + DTOs  
**Estimated Time**: 32-44 hours  

---

## ✅ CONFIRMED DECISIONS

### 1. Implementation Strategy
**Decision**: Backend → Testing → Frontend (Strategy B)
- Complete backend fully (Phases 1-7)
- Test backend thoroughly (Phase 8)
- Then implement frontend (Phases 9-10)

### 2. DDT Edit Rules
**Decision**: DDT CANNOT be modified after confirmation
- **Editable**: Draft status ONLY
- **NOT Editable**: Issued, In Transit, Delivered, Cancelled
- **Immutable After Creation**: Type, Warehouses
- **Reason**: Stock movements already generated, reversing would be complex and error-prone

### 3. Event-Driven Architecture
**Decision**: ALL modules communicate via Events + Listeners
- **Actions dispatch Events** (NOT call other Actions/Services)
- **Listeners handle side effects** (stock movements, notifications, audit)
- **NO direct cross-module dependencies**

**Example Flow**:
```
User confirms DDT
  → DdtController calls ConfirmDdtAction
    → ConfirmDdtAction validates + updates status + dispatches DdtConfirmed event
      → GenerateStockMovementsListener listens to DdtConfirmed
        → Creates stock movements for each item
        → Updates inventory
        → Dispatches StockMovementCreated events
          → CheckLowStockAfterMovementListener checks if low stock
            → Dispatches InventoryLowStock if needed
              → SendLowStockAlertListener sends notification
```

**Benefits**:
- ✅ Loose coupling between modules
- ✅ Easy to extend (add listeners without changing Actions)
- ✅ Testable (test Actions + Listeners separately)
- ✅ Audit trail (all events logged)

### 4. Query Classes
**Decision**: Create Query Classes for ALL complex database reads
- **Location**: `app/Queries/Inventory/`, `app/Queries/StockMovement/`, `app/Queries/Ddt/`
- **Pattern**: Readonly classes with execute() method
- **Naming**: `GetInventoryQuery`, `GetLowStockItemsQuery`, etc.
- **Services**: Keep ONLY calculations/utilities (NO database operations)

**Why**:
- Services become too large with complex queries
- Query Classes are reusable and testable
- Clear separation: Queries (read), Actions (write), Services (calculations)

### 5. Events to Implement
**Decision**: Full audit trail with 10 events

**Inventory Events** (4):
- `InventoryAdjusted` - Stock manually adjusted
- `InventoryLowStock` - Stock under minimum (EXISTS, enhance)
- `InventoryReserved` - Stock reserved for site/order
- `InventoryReservationReleased` - Reservation cancelled

**StockMovement Events** (2):
- `StockMovementCreated` - Movement recorded
- `StockMovementReversed` - Movement cancelled/corrected

**DDT Events** (6):
- `DdtCreated` - DDT created (Draft)
- `DdtUpdated` - DDT updated (Draft only)
- `DdtConfirmed` - DDT confirmed → **triggers stock movements**
- `DdtCancelled` - DDT cancelled → **reverses stock movements**
- `DdtDelivered` - DDT delivered → **updates site_materials**
- `DdtDeleted` - DDT deleted (soft delete)

---

## 📋 10-PHASE IMPLEMENTATION PLAN

### **PHASE 1: Fix Backend Models** (2-3h) 🔴 CRITICAL
**Goal**: Update models to use Product instead of Material

**Files to Update**:
1. `StockMovement.php` - Change `material_id` → `product_id`, `material()` → `product()`
2. `DdtItem.php` - Change `material_id` → `product_id`, `material()` → `product()`
3. Verify `Inventory.php` - Already updated but double-check
4. Verify `Ddt.php` - Check relationships

**Tasks** (4):
- [x] Update StockMovement model
- [x] Update DdtItem model
- [x] Verify Inventory model
- [x] Verify Ddt model
- [x] Run `php artisan migrate:status` to confirm migrations ran

---

### **PHASE 2: Spatie Data DTOs** (3-4h) 🔴 CRITICAL
**Goal**: Create 4 DTOs for input validation + output

**DTOs to Create**:
1. `InventoryData.php` (200 LOC)
2. `StockMovementData.php` (220 LOC)
3. `DdtItemData.php` (100 LOC)
4. `DdtData.php` (280 LOC)

**Tasks** (4):
- [x] Create InventoryData with validation + Lazy relationships
- [x] Create StockMovementData with enums + Lazy relationships
- [x] Create DdtItemData with computed total_cost
- [x] Create DdtData with DataCollections for items/movements
- [x] Run `php artisan typescript:transform` to generate TS types
- [x] Verify TS types in `resources/types/generated.d.ts`

---

### **PHASE 3: Events & Listeners** (5-6h) 🔴 CRITICAL
**Goal**: Create event-driven architecture for loose coupling

**Events to Create** (10):
- [x] InventoryAdjusted
- [x] InventoryReserved
- [x] InventoryReservationReleased
- [x] StockMovementCreated
- [x] StockMovementReversed
- [x] DdtCreated
- [x] DdtUpdated
- [x] DdtConfirmed (CRITICAL)
- [x] DdtCancelled (CRITICAL)
- [x] DdtDelivered (CRITICAL)
- [x] DdtDeleted

**Listeners to Create** (10):
- [x] LogInventoryAdjustmentListener
- [x] LogInventoryReservationListener
- [x] CheckLowStockAfterMovementListener
- [x] LogStockMovementListener
- [x] **GenerateStockMovementsListener** (MOST IMPORTANT - 400 LOC)
- [x] **ReverseStockMovementsListener** (CRITICAL - 200 LOC)
- [x] **UpdateSiteMaterialsListener** (CRITICAL - 100 LOC)
- [x] NotifyWarehouseManagerListener
- [x] LogDdtActivityListener
- [x] Verify SendLowStockAlertListener (already exists)

**Tasks**:
- [x] Create 10 events
- [x] Create 10 listeners
- [x] Register in EventServiceProvider
- [x] **IMPORTANT**: Move processIncoming/processOutgoing/etc. logic from DdtService to GenerateStockMovementsListener

---

### **PHASE 4: Query Classes** (3-4h) 🔴 CRITICAL
**Goal**: Move all database reads from Services to Query Classes

**Inventory Queries** (5):
- [x] GetInventoryQuery
- [x] GetLowStockItemsQuery
- [x] GetInventoryByWarehouseQuery
- [x] GetInventoryByProductQuery
- [x] GetStockValuationQuery

**StockMovement Queries** (3):
- [x] GetStockMovementsQuery
- [x] GetMovementHistoryByProductQuery
- [x] GetRentalHistoryQuery

**DDT Queries** (4):
- [x] GetDdtsQuery
- [x] GetDdtByIdQuery
- [x] GetActiveDdtsBySiteQuery
- [x] GetPendingRentalReturnsQuery

**Tasks** (12 Query Classes):
- [x] Create directory structure (Inventory/, StockMovement/, Ddt/)
- [x] Implement 12 Query Classes
- [x] Use readonly classes pattern
- [x] Return Collection or LengthAwarePaginator

---

### **PHASE 5: Actions Pattern** (6-8h) 🔴 CRITICAL
**Goal**: Create Actions for all write operations

**Inventory Actions** (3):
- [x] AdjustInventoryAction (dispatches InventoryAdjusted + InventoryLowStock)
- [x] ReserveInventoryAction (dispatches InventoryReserved)
- [x] ReleaseInventoryReservationAction (dispatches InventoryReservationReleased)

**StockMovement Actions** (1):
- [x] ReverseStockMovementAction (dispatches StockMovementReversed)
- **NOTE**: CreateStockMovementAction NOT needed (done by GenerateStockMovementsListener)

**DDT Actions** (6):
- [x] CreateDdtAction (dispatches DdtCreated)
- [x] UpdateDdtAction (dispatches DdtUpdated, only Draft)
- [x] DeleteDdtAction (dispatches DdtDeleted, only Draft)
- [x] ConfirmDdtAction (dispatches DdtConfirmed → GenerateStockMovementsListener creates movements)
- [x] CancelDdtAction (dispatches DdtCancelled → ReverseStockMovementsListener reverses movements)
- [x] DeliverDdtAction (dispatches DdtDelivered → UpdateSiteMaterialsListener updates site_materials)

**Tasks** (10 Actions):
- [x] Create directory structure (Inventory/, StockMovement/, Ddt/)
- [x] Implement 10 Actions
- [x] Use DTOs for input/output
- [x] Use DB::transaction() in all Actions
- [x] Actions dispatch Events, NOT call other Actions

---

### **PHASE 6: Refactor Services** (2-3h) 🔴 CRITICAL
**Goal**: Remove DB operations from Services, keep only utilities

**InventoryService**:
- [x] Remove ALL query methods (use Query Classes)
- [x] Remove ALL write methods (use Actions)
- [x] Keep ONLY calculation methods (calculateReorderQuantity, calculateDaysOfStock)
- [x] Consider deleting if empty

**DdtService**:
- [x] Remove ALL query methods (use Query Classes)
- [x] Remove ALL write methods (use Actions)
- [x] Remove processIncoming/processOutgoing/etc. (moved to GenerateStockMovementsListener)
- [x] Keep ONLY calculation methods (calculateEstimatedDelivery, isOverdue)
- [x] Consider deleting if empty

**Tasks**:
- [x] Refactor InventoryService
- [x] Refactor DdtService
- [x] Verify no DB operations remain

---

### **PHASE 7: Update Controllers** (3-4h) 🔴 CRITICAL
**Goal**: Use DTOs + Actions + Query Classes in controllers

**InventoryController**:
- [x] Replace `material_id` → `product_id`
- [x] Remove manual validation, use InventoryData::from()
- [x] Replace Service calls with Query Class instantiation
- [x] Inject Actions via method injection
- [x] Return InventoryData/StockMovementData (not Resources)

**StockMovementController**:
- [x] Replace `material_id` → `product_id`
- [x] Remove intake/output/transfer endpoints (done by listeners)
- [x] Keep only listing + reverse endpoint
- [x] Use Query Classes
- [x] Return StockMovementData

**DdtController**:
- [x] Remove StoreDdtRequest/UpdateDdtRequest
- [x] Use DdtData::from($request)
- [x] Replace DdtService calls with Query Classes + Actions
- [x] Inject 6 Actions via method injection
- [x] Return DdtData (not DdtResource)

**Tasks**:
- [x] Update InventoryController
- [x] Update StockMovementController
- [x] Update DdtController
- [x] Remove StoreDdtRequest.php
- [x] Remove UpdateDdtRequest.php

---

### **PHASE 8: Backend Testing** (4-6h) 🟡 HIGH
**Goal**: Test all backend functionality

**Unit Tests**:
- [x] InventoryData DTO test
- [x] StockMovementData DTO test
- [x] DdtItemData DTO test
- [x] DdtData DTO test
- [x] AdjustInventoryAction test
- [x] ReserveInventoryAction test
- [x] CreateDdtAction test
- [x] ConfirmDdtAction test (CRITICAL)
- [x] CancelDdtAction test (CRITICAL)
- [x] GenerateStockMovementsListener test (CRITICAL)
- [x] ReverseStockMovementsListener test (CRITICAL)

**Integration Tests**:
- [x] Inventory API endpoints test
- [x] StockMovement API endpoints test
- [x] DDT API endpoints test
- [x] DDT confirm workflow test (Draft → Issued → stock movements created)
- [x] DDT cancel workflow test (Issued → Cancelled → stock movements reversed)
- [x] DDT deliver workflow test (Delivered → site_materials updated)

**Tasks**:
- [x] Create test factories (Inventory, StockMovement, Ddt, DdtItem)
- [x] Write 25+ tests
- [x] Run `php artisan test`
- [x] Ensure 100% pass rate
- [x] Run `./vendor/bin/pint` (code style)

---

### **PHASE 9: Frontend Implementation** (8-12h) 🟡 HIGH
**Goal**: Create UI for Inventory, Stock Movements, DDT

**Inventory Pages** (2):
- [x] `/inventory` - List/dashboard with filters ✅
- [x] `/inventory/[id]` - Detail with history ✅ COMPLETED

**Components** (4):
- [x] inventory-columns.tsx ✅
- [x] inventory-adjust-dialog.tsx ✅
- [x] inventory-transfer-dialog.tsx ✅
- [x] inventory-stats.tsx ✅ COMPLETED

**API Client**:
- [x] lib/api/inventory.ts (8 endpoints) ✅

**React Query Hooks**:
- [x] hooks/use-inventory.ts (8 hooks) ✅

**Stock Movements Pages** (1):
- [x] `/stock-movements` - List with filters ✅ UPDATED with StockMovementFilters

**Components** (3):
- [x] stock-movement-columns.tsx ✅
- [x] stock-movement-type-badge.tsx ✅
- [x] stock-movement-filters.tsx ✅ INTEGRATED with date filters

**API Client**:
- [x] lib/api/stock-movements.ts (5 endpoints) ✅

**React Query Hooks**:
- [x] hooks/use-stock-movements.ts (5 hooks) ✅

**DDT Pages** (4):
- [x] `/ddts` - List with filters ✅
- [x] `/ddts/[id]` - Detail with actions ✅
- [x] `/ddts/new` - Create form ✅
- [x] `/ddts/[id]/edit` - Edit form (Draft only) ✅ COMPLETED (with guard)

**Components** (8):
- [x] ddt-form.tsx (main form) ✅ (EXISTS in /ddts/new/page.tsx - extraction deferred)
- [x] ddt-columns.tsx ✅
- [x] ddt-items-table.tsx ✅ COMPLETED
- [x] ddt-type-badge.tsx ✅
- [x] ddt-status-badge.tsx ✅
- [x] ddt-type-select.tsx ✅
- [x] ddt-confirm-dialog.tsx ✅
- [x] ddt-cancel-dialog.tsx ✅

**API Client**:
- [x] lib/api/ddts.ts (11 endpoints) ✅

**React Query Hooks**:
- [x] hooks/use-ddts.ts (11 hooks) ✅

**Tasks**:
- [x] Create 4/4 pages ✅
- [x] Create 15/15 components ✅
- [x] Create 3/3 API clients ✅
- [x] Create 3/3 React Query hooks ✅
- [x] Add types to lib/types/index.ts ✅
- [x] Dark mode support ✅
- [x] Add to navigation menu ✅
- [x] Integrate components in pages ✅
- [x] Fix all TypeScript errors ✅
- [ ] Test all CRUD operations ❌

**Progress**: 97% (29/30 tasks completed)

---

### **PHASE 10: Frontend Testing** (2-3h) 🟢 MEDIUM
**Goal**: Test frontend functionality

**Component Tests** (Vitest):
- [ ] Inventory list test
- [ ] Inventory adjust dialog test
- [ ] DDT form test
- [ ] DDT items table test
- [ ] Stock movement list test

**E2E Tests** (Playwright):
- [ ] Create DDT flow
- [ ] Confirm DDT flow
- [ ] Adjust inventory flow

**Tasks**:
- [ ] Set up Vitest
- [ ] Write 10+ component tests
- [ ] Write 5+ E2E tests
- [ ] Run `npm run test`
- [ ] Run `npm run lint:fix`

---

## 📊 PROGRESS TRACKING

### Overall Progress: 96% 🟢

| Phase | Status | Progress | Time | Priority |
|-------|--------|----------|------|----------|
| 1. Fix Models | ✅ COMPLETED | 4/4 | 2h | 🔴 CRITICAL |
| 2. DTOs | ✅ COMPLETED | 4/4 | 3h | 🔴 CRITICAL |
| 3. Events & Listeners | ✅ COMPLETED | 20/20 | 5h | 🔴 CRITICAL |
| 4. Query Classes | ✅ COMPLETED | 12/12 | 3h | 🔴 CRITICAL |
| 5. Actions | ✅ COMPLETED | 10/10 | 6h | 🔴 CRITICAL |
| 6. Services | ✅ COMPLETED | 2/2 | 2h | 🔴 CRITICAL |
| 7. Controllers | ✅ COMPLETED | 3/3 | 3h | 🔴 CRITICAL |
| 8. Backend Tests | ✅ COMPLETED | 25/25 | 4h | 🟡 HIGH |
| 9. Frontend | ✅ COMPLETED | 29/30 | 10h/10h | 🟡 HIGH |
| 10. Frontend Tests | ❌ Not Started | 0/15+ | 2-3h | 🟢 MEDIUM |
| **TOTAL** | **96%** | **119/124** | **38h/40h** | |

---

## 🚀 HOW TO START

### Day 1 (8h) - Critical Backend Foundation
1. **Morning (4h)**: Phase 1 + Phase 2
   - Fix Models (2h)
   - Create DTOs (2h)
   - Milestone: DTOs created, TS types generated

2. **Afternoon (4h)**: Phase 3 (Events & Listeners)
   - Create 10 events (1h)
   - Create critical listeners (3h): GenerateStockMovementsListener, ReverseStockMovementsListener, UpdateSiteMaterialsListener
   - Milestone: Event-driven architecture in place

### Day 2 (8h) - Backend Implementation
1. **Morning (4h)**: Phase 4 + Phase 5 (start)
   - Create 12 Query Classes (2h)
   - Create 3 Inventory Actions (1h)
   - Create 1 StockMovement Action (1h)

2. **Afternoon (4h)**: Phase 5 (finish)
   - Create 6 DDT Actions (4h)
   - Milestone: All Actions created

### Day 3 (8h) - Backend Completion
1. **Morning (3h)**: Phase 6 + Phase 7
   - Refactor Services (2h)
   - Update Controllers (1h start)

2. **Afternoon (5h)**: Phase 7 (finish) + Phase 8
   - Update Controllers (2h finish)
   - Backend Testing (3h)
   - Milestone: Backend complete and tested

### Day 4 (8h) - Frontend Implementation
1. **Full Day**: Phase 9
   - Inventory pages + components (3h)
   - DDT pages + components (4h)
   - Stock Movement pages + components (1h)
   - Milestone: Frontend 50% complete

### Day 5 (4-8h) - Frontend Completion + Testing
1. **Morning (4h)**: Phase 9 (finish)
   - Finish DDT components (2h)
   - API clients (1h)
   - Polish + dark mode (1h)

2. **Afternoon (2-3h)**: Phase 10
   - Frontend testing
   - Milestone: **PROJECT COMPLETE** ✅

---

## 📈 SUCCESS METRICS

### Completion Criteria
- [ ] ✅ All 4 models updated (Product not Material)
- [ ] ✅ All 4 DTOs created with TS types
- [ ] ✅ All 10 events created
- [ ] ✅ All 10 listeners created and registered
- [ ] ✅ All 12 Query Classes created
- [ ] ✅ All 10 Actions created
- [ ] ✅ Services refactored (no DB operations)
- [ ] ✅ Controllers use DTOs + Actions + Query Classes
- [ ] ✅ All backend tests pass (25+)
- [ ] ✅ All frontend pages created (8)
- [ ] ✅ All frontend components created (15)
- [ ] ✅ All API clients created (3)
- [ ] ✅ All frontend tests pass (15+)
- [ ] ✅ `php artisan test` - 100% pass
- [ ] ✅ `./vendor/bin/pint` - No style errors
- [ ] ✅ `npm run lint:fix` - No lint errors
- [ ] ✅ Manual testing complete

### Quality Metrics
- **Code Coverage**: Target 80%+ for Actions/Listeners
- **Type Safety**: 100% (TS types auto-generated)
- **Architecture Compliance**: 100% (all rules followed)
- **Performance**: DDT confirm < 500ms, Inventory list < 200ms

---

## 🎯 CRITICAL PATHS

### Path 1: DDT Workflow (MOST IMPORTANT)
```
CreateDdtAction → DdtCreated event
  → ConfirmDdtAction → DdtConfirmed event
    → GenerateStockMovementsListener → Stock movements created
      → StockMovementCreated events → Inventory updated
        → CheckLowStockAfterMovementListener → InventoryLowStock events (if needed)
          → SendLowStockAlertListener → Notifications sent
```

**Why Critical**: Core business logic, most complex workflow

### Path 2: DDT Cancellation
```
CancelDdtAction → DdtCancelled event
  → ReverseStockMovementsListener → Movements reversed → Inventory restored
```

**Why Critical**: Must properly undo stock changes

### Path 3: DDT Delivery
```
DeliverDdtAction → DdtDelivered event
  → UpdateSiteMaterialsListener → site_materials table updated
```

**Why Critical**: Updates site inventory

---

## 🔗 KEY FILES TO REFERENCE

### Architecture
- `/backend/AI_ARCHITECTURE_RULES.md` - MANDATORY reading
- `/backend/FINAL_ARCHITECTURE.md` - Architecture overview
- `/backend/WAREHOUSE_REFACTORING.md` - Warehouse-specific patterns

### Examples to Follow
- `/backend/app/Actions/Product/` - Actions pattern example
- `/backend/app/Data/ProductData.php` - DTO example
- `/backend/app/Queries/Product/` - Query Classes example
- `/backend/app/Events/WarehouseCreated.php` - Event example
- `/backend/app/Listeners/SendLowStockAlert.php` - Listener example

### Current State
- `/backend/app/Models/StockMovement.php` - NEEDS UPDATE (material → product)
- `/backend/app/Models/DdtItem.php` - NEEDS UPDATE (material → product)
- `/backend/app/Services/InventoryService.php` - NEEDS REFACTOR (remove DB ops)
- `/backend/app/Services/DdtService.php` - NEEDS REFACTOR (move logic to listeners)

---

## ⚠️ IMPORTANT NOTES

### DO NOT:
- ❌ Keep FormRequest classes (use Spatie Data DTOs)
- ❌ Keep Resource classes (use Spatie Data DTOs)
- ❌ Put DB operations in Services
- ❌ Call Actions from other Actions
- ❌ Call Listeners from Actions (dispatch Events instead)
- ❌ Use Material model (use Product)

### DO:
- ✅ Use Spatie Data for BOTH input + output
- ✅ Use Actions for write operations
- ✅ Use Query Classes for complex reads
- ✅ Use Events + Listeners for module communication
- ✅ Use DB::transaction() in all Actions
- ✅ Dispatch Events from Actions
- ✅ Use Product model everywhere

---

## 🎉 FINAL CHECKLIST

### Before Starting:
- [ ] Read `WAREHOUSE_MODULE_REFACTOR_CHECKLIST.md` completely
- [ ] Read `/backend/AI_ARCHITECTURE_RULES.md` (MANDATORY)
- [ ] Understand event-driven architecture
- [ ] Understand Query Classes pattern
- [ ] Review example files

### During Implementation:
- [ ] Follow phases sequentially
- [ ] Test after each phase
- [ ] Commit after each phase
- [ ] Update this roadmap with progress

### After Completion:
- [ ] Update `/TODO.md` with completion status
- [ ] Run `./vendor/bin/pint` (backend)
- [ ] Run `php artisan typescript:transform` (generate TS types)
- [ ] Run `npm run lint:fix` (frontend)
- [ ] Run `php artisan test` (backend tests)
- [ ] Run `npm run test` (frontend tests)
- [ ] Manual testing of all workflows
- [ ] Mark `WAREHOUSE_MODULE_REFACTOR_CHECKLIST.md` as complete ✅

---

**Created**: 23 January 2026  
**Last Updated**: 23 January 2026  
**Status**: 🚧 Ready for Implementation  
**Next Step**: Phase 1 - Fix Backend Models (2-3h)
