# Personnel & Labor Management — Implementation Plan

**Feature**: Quote labor items → Project worker slots → Assignment → Scheduling → Hour logging → Expenses → Final Balance
**Version**: 2.0
**Date**: March 2026
**Status**: Core implementation complete — UI gaps documented below

---

## ⚠️ MANDATORY PRE-IMPLEMENTATION RULES

### Rule 1 — Always check what already exists
> Before writing ANY code for each phase, always verify what already exists.
> Check: models, migrations, controllers, actions, events, listeners, frontend components, API routes.

### Rule 2 — Always use subagents
> Use subagents (Task tool) for all non-trivial work within each phase.
> Never attempt to explore, read, and implement everything in a single context.

---

## Implementation Checklist

### Backend
- [x] Migrations run (6 migrations)
- [x] Enums: `ProjectWorkerStatus` (+slot), `ProjectExpenseCategory`, `ProjectScheduleDayStatus`, `ProjectLogStatus`, `ProjectExpenseStatus`
- [x] Models: `ProjectWorkerSchedule`, `ProjectLaborLog`, `ProjectExpense`
- [x] Models updated: `QuoteItem`, `ProjectWorker`, `Product`, `Project`, `Worker`
- [x] DTOs: `QuoteItemData` (+cost_price), `ProjectWorkerData` (+slot fields), `ProjectWorkerScheduleData`, `ProjectLaborLogData`, `ProjectExpenseData`, `FinalBalanceData`
- [x] Actions: `CreateProjectWorkerSlotsAction`, `AssignWorkerToSlotAction`, `CreateWorkerScheduleAction`, `LogLaborHoursAction`, `ApproveLaborLogAction`, `RejectLaborLogAction`, `CreateProjectExpenseAction`, `ApproveProjectExpenseAction`, `RejectProjectExpenseAction`
- [x] Service: `FinalBalanceService` (fixed SQL: `used_quantity`, `actual_unit_cost`)
- [x] Events: `LaborLogApproved`, `ProjectExpenseApproved`
- [x] Listener: `CreateLaborSlotsFromQuoteListener` (hooked to `QuoteConvertedToProject`)
- [x] Controllers: `ProjectWorkerScheduleController`, `ProjectLaborLogController`, `ProjectExpenseController`
- [x] Controllers updated: `ProjectWorkerController` (+assignSlot), `ProjectController` (+finalBalance)
- [x] Policies: `ProjectLaborLogPolicy`, `ProjectExpensePolicy`
- [x] Routes: 20+ new routes registered
- [ ] Settings seeded (`project.expense_auto_approve_threshold`, `project.hours_per_day`, etc.)

### Frontend
- [x] Types: `ProjectWorkerStatus` (+slot), `ProjectWorker` (+slot fields), `ProjectWorkerSchedule`, `ProjectLaborLog`, `ProjectExpense`, `FinalBalance`
- [x] API: `project-labor-logs.ts`, `project-expenses.ts`
- [x] API updated: `project-workers.ts` (+assignSlot, +getSchedules, +createSchedule), `projects.ts` (+getFinalBalance)
- [x] Quote item dialog: type "Labor" (Manodopera) added to Select + cost_price field shown for labor items
- [x] Component: `project-labor-slots-section.tsx` (Personale tab — unassigned slots + assign dialog)
- [x] Component: `project-labor-logs-section.tsx` (Ore tab — approve/reject + **Invia Ore** dialog)
- [x] Component: `project-expenses-section.tsx` (Spese tab — approve/reject + **Aggiungi Spesa** dialog)
- [x] Component: `project-final-balance-tab.tsx` (Final Balance tab)
- [x] Project page: 4 new tabs added (Personale, Ore, Spese, Final Balance)
- [ ] Gap 1: Assignment acceptance page `/assignments/[id]/page.tsx`
- [ ] Gap 4: Schedule management dialog (per eventi con `is_scheduled=true`)
- [ ] Gap 5: Worker mobile dashboard

---

## Implementation Status

### ✅ Sprint 1 — Core Data Model (DONE)

**Migrations run:**
- `2026_03_06_162651` — `cost_price decimal(10,2) nullable` on `quote_items`
- `2026_03_06_162652` — `billing_unit_default string nullable` on `products`
- `2026_03_06_162652` — Labor slot fields on `project_workers`:
  - `worker_id` → made nullable (was NOT NULL)
  - `assigned_from` → made nullable
  - `role_name`, `slot_index`, `quote_item_id` FK, `estimated_days`
  - `budget_cost_rate`, `actual_cost_rate`, `customer_rate`
  - `is_external bool`, `is_scheduled bool`
- `2026_03_06_162653_a` — `project_worker_schedules` table
- `2026_03_06_162653_b` — `project_labor_logs` table
- `2026_03_06_162653_c` — `project_expenses` table

**New Enums:**
- `ProjectWorkerStatus` — added `Slot = 'slot'` case
- `ProjectExpenseCategory` — travel, accommodation, meal, fuel, toll, parking, equipment, communication, other
- `ProjectScheduleDayStatus` — pending, accepted, rejected, modified, completed, cancelled
- `ProjectLogStatus` — draft, submitted, approved, rejected
- `ProjectExpenseStatus` — draft, submitted, auto_approved, approved, rejected

**New Models:** `ProjectWorkerSchedule`, `ProjectLaborLog`, `ProjectExpense`

**Updated Models:** `QuoteItem` (+cost_price, margin accessors, projectWorkerSlots relation), `ProjectWorker` (+slot fields, schedules/laborLogs relations, scopeSlots/scopeAssigned), `Product` (+billing_unit_default), `Project` (+expenses/laborLogs), `Worker` (+laborLogs, schedules)

**DTOs updated:** `QuoteItemData` (+cost_price, margin_amount, margin_percent), `ProjectWorkerData` (+all slot fields)

**New DTOs:** `ProjectWorkerScheduleData`, `ProjectLaborLogData`, `ProjectExpenseData`, `FinalBalanceData`

---

### ✅ Sprint 2 — Business Logic (DONE)

**Actions created (`app/Actions/Project/`):**
- `CreateProjectWorkerSlotsAction` — creates slot ProjectWorkers from labor quote items (qty=N → N slots)
- `AssignWorkerToSlotAction` — assigns Worker to slot; external→Pending+notification, internal→Active; looks up actual_cost_rate from WorkerRate
- `CreateWorkerScheduleAction` — upserts a schedule day for a slot (unique on project_worker_id + date)
- `LogLaborHoursAction` — creates ProjectLaborLog in Submitted status
- `ApproveLaborLogAction` — approves log → creates ProjectLaborCost → updates project.actual_cost
- `RejectLaborLogAction` — rejects log with reason
- `CreateProjectExpenseAction` — creates expense; auto-approves if amount ≤ `project.expense_auto_approve_threshold` (default 50€)
- `ApproveProjectExpenseAction` — manual PM approval
- `RejectProjectExpenseAction` — rejection with reason

**Service created:**
- `FinalBalanceService::compute(Project)` → returns `FinalBalanceData` with revenue breakdown, cost breakdown, margin

**Events + Listeners:**
- `LaborLogApproved` event (dispatched by ApproveLaborLogAction)
- `ProjectExpenseApproved` event (dispatched by Create/ApproveProjectExpenseAction)
- `CreateLaborSlotsFromQuoteListener` — listens to `QuoteConvertedToProject`, auto-creates slots
- EventServiceProvider updated to register the new listener

---

### ✅ Sprint 3 — API Layer (DONE)

**New Controllers:**
- `ProjectWorkerScheduleController` — index, store, show, update, destroy, accept, reject
- `ProjectLaborLogController` — index (by project), store (by worker slot), show, approve, reject
- `ProjectExpenseController` — index, store, show, update, approve, reject, destroy

**Updated Controllers:**
- `ProjectWorkerController` — added `assignSlot()` method
- `ProjectController` — added `finalBalance()` method

**New Policies:** `ProjectLaborLogPolicy`, `ProjectExpensePolicy`

**New Routes (20+):**
```
POST   /api/v1/project-workers/{pw}/assign-slot
GET    /api/v1/project-workers/{pw}/schedules
POST   /api/v1/project-workers/{pw}/schedules
GET    /api/v1/project-worker-schedules/{s}
PUT    /api/v1/project-worker-schedules/{s}
DELETE /api/v1/project-worker-schedules/{s}
POST   /api/v1/project-worker-schedules/{s}/accept
POST   /api/v1/project-worker-schedules/{s}/reject
GET    /api/v1/projects/{p}/labor-logs
POST   /api/v1/project-workers/{pw}/labor-logs
GET    /api/v1/project-labor-logs/{l}
POST   /api/v1/project-labor-logs/{l}/approve
POST   /api/v1/project-labor-logs/{l}/reject
GET    /api/v1/projects/{p}/expenses
POST   /api/v1/projects/{p}/expenses
GET    /api/v1/project-expenses/{e}
PUT    /api/v1/project-expenses/{e}
DELETE /api/v1/project-expenses/{e}
POST   /api/v1/project-expenses/{e}/approve
POST   /api/v1/project-expenses/{e}/reject
GET    /api/v1/projects/{p}/final-balance
```

---

### ✅ Sprint 4-8 — Frontend (DONE — core PM flows)

**Updated:**
- `lib/types/index.ts` — `ProjectWorkerStatus` (+slot), slot fields on `ProjectWorker`, new interfaces: `ProjectWorkerSchedule`, `ProjectLaborLog`, `ProjectExpense`, `FinalBalance`
- `lib/api/project-workers.ts` — added `assignSlot()`, `getSchedules()`, `createSchedule()`
- `lib/api/projects.ts` — added `getFinalBalance()`
- `components/quote-items/item-form-dialog.tsx` — `cost_price` field shown for labor items (+ margin preview)
- `components/quote-items/index.tsx` — cost_price included in new item creation
- `projects/_components/project-worker-status-badge.tsx` — added `slot` badge (CircleDashed icon)

**New files:**
- `lib/api/project-labor-logs.ts`
- `lib/api/project-expenses.ts`
- `projects/_components/project-labor-slots-section.tsx`
- `projects/_components/project-labor-logs-section.tsx`
- `projects/_components/project-expenses-section.tsx`
- `projects/_components/project-final-balance-tab.tsx`
- `app/(dashboard)/projects/[id]/page.tsx` — 4 new tabs: **Personale**, **Ore**, **Spese**, **Final Balance**

---

## ❌ UI Gaps (Still Missing)

### Gap 1 — Worker's assignment acceptance/rejection page
Workers receive an email notification with `accept`/`reject` links pointing to `/dashboard/assignments/{id}/accept` and `/dashboard/assignments/{id}/reject`. These pages **do not exist** in the frontend.

**API already exists:** `POST /project-workers/{id}/accept` and `reject` (via `projectWorkersApi.acceptAssignment()`)

**What to build:** A page at `app/(dashboard)/assignments/[id]/page.tsx` that shows the assignment details (project, role, dates, rate) and two buttons: Accept / Reject.

---

### Gap 2 — Worker's labor log submission form
Workers need a way to submit their hours from their own view. Currently the `ProjectLaborLogsSection` only shows the PM's approve/reject view.

**API already exists:** `POST /project-workers/{pw}/labor-logs`

**What to build:**
- A dialog or section on the worker's project view (or `workers/[id]/page.tsx`) that lists their active project assignments and lets them submit hours for a given date.
- Component: `submit-labor-log-dialog.tsx` with fields: date, regular_hours, overtime_hours, description.

---

### Gap 3 — Expense submission form (worker + PM)
Workers and PM can submit expenses via API but there's no UI button/dialog to create one. The `ProjectExpensesSection` only shows the approve/reject list.

**API already exists:** `POST /projects/{p}/expenses`

**What to build:**
- A "Aggiungi Spesa" button in `ProjectExpensesSection` that opens a dialog with: category, description, amount, date, is_billable_to_client, notes.
- Component: `submit-expense-dialog.tsx`

---

### Gap 4 — Schedule management (PM creates days)
For event-type projects with `is_scheduled=true`, the PM should be able to assign specific days to each worker slot. The backend supports full CRUD.

**API already exists:** `GET/POST /project-workers/{pw}/schedules`, `PUT/DELETE /project-worker-schedules/{s}`, accept/reject

**What to build:**
- A "Gestisci Giorni" button per worker in `ProjectLaborSlotsSection` that opens a schedule management dialog.
- Calendar-like UI or date list to add/remove days, set start/end times.

---

### Gap 5 — Worker dashboard (mobile-friendly view)
Workers need to see:
- Their active project assignments
- Their scheduled days (with accept/reject)
- A submit hours button

**Already exists:** `app/(dashboard)/dashboard/worker/page.tsx` — extend this with assignment/scheduling info.

---

## Settings to Configure

Run this seeder or add manually to the `settings` table:

```sql
-- Project settings (group = 'project')
INSERT INTO settings (group, key, value) VALUES
  ('project', 'expense_auto_approve_threshold', '50'),   -- auto-approve expenses ≤ 50€
  ('project', 'hours_per_day', '8'),                     -- used for estimated_days → hours conversion
  ('project', 'hours_per_month_internal', '160'),        -- for internal worker cost calculation
  ('project', 'schedule_change_behavior', 'notify');     -- 'notify' | 'reaccept'
```

Or add to `SettingSeeder.php` and run `php artisan db:seed --class=SettingSeeder`.

---

## Business Flow (How It All Works)

```
1. QUOTE CREATION
   PM creates quote with labor items (type=labor):
   - description = "Fonico"
   - quantity = 1 (how many workers needed)
   - billing_unit = day
   - unit_price = 300 (what client pays per day)
   - cost_price = 180 (what you pay the worker per day)

2. QUOTE APPROVED → CONVERTED TO PROJECT
   Automatic: CreateLaborSlotsFromQuoteListener fires
   → Creates ProjectWorker slots (status='slot', worker_id=null)
   → qty=2 creates 2 separate slots (slot_index 1, 2)

3. PM ASSIGNS WORKERS (Personale tab on project)
   → Selects worker for each slot
   → External worker: status=Pending, email notification sent
   → Internal worker: status=Active immediately

4. EXTERNAL WORKER ACCEPTS (email link or assignments page - GAP 1)
   → POST /project-workers/{id}/accept
   → status = Accepted

5. FOR EVENT PROJECTS: PM CREATES SCHEDULE DAYS (GAP 4)
   → POST /project-workers/{pw}/schedules
   → Worker accepts/rejects each day (email link or app - GAP 1)

6. WORKERS SUBMIT HOURS (GAP 2)
   → POST /project-workers/{pw}/labor-logs
   → { log_date, regular_hours, overtime_hours, description }

7. PM REVIEWS HOURS (Ore tab on project)
   → Approve → creates ProjectLaborCost automatically
   → Reject → sends reason back to worker

8. WORKERS/PM SUBMIT EXPENSES (GAP 3)
   → POST /projects/{p}/expenses
   → Auto-approved if amount ≤ threshold (50€ default)

9. PM REVIEWS EXPENSES (Spese tab on project)
   → Approve / Reject submitted expenses

10. FINAL BALANCE (Final Balance tab on project)
    → Click "Calcola Final Balance"
    → Shows: approved quote + extra hours revenue + billable expenses
      vs: labor costs + materials + approved expenses
    → Gross margin + percentage
```

---

## Context & Business Logic (Original)

### The Three Scenarios

**1. Sale + Installation Labor**
```
Quote Item (type=item):   Proiettore 4K   qty:2   price:800€   → products
Quote Item (type=labor):  Installazione   qty:1   billing:hour  duration:8h
                          unit_price:50€/h  cost_price:30€/h   → labor
```

**2. Rental + Transport**
```
Quote Item (type=item):   Casse audio     qty:4   billing:day  duration:3d  price:50€/d
Quote Item (type=labor):  Trasporto       qty:1   billing:flat price:200€   cost_price:120€
```

**3. Service/Event** (most complex)
```
Quote: type=event, event_days=3

Quote Items (type=labor):
  Fonico           qty:1  billing:day  duration:2d  unit_price:300€/d  cost_price:180€/d
  Tecnico Audio    qty:1  billing:day  duration:3d  unit_price:250€/d  cost_price:150€/d
  Facchino         qty:2  billing:day  duration:1d  unit_price:150€/d  cost_price:90€/d
                                                     ↓
After conversion:
  Slot #1: "Fonico"        → assign worker → Pending/Active
  Slot #2: "Tecnico Audio" → assign worker → Pending/Active
  Slot #3: "Facchino" #1   → assign worker → Pending/Active
  Slot #4: "Facchino" #2   → assign worker → Pending/Active
```

### Cost Model
```
External worker: actual_cost_rate from WorkerRate (RateContext::InternalCost, RateType::Hourly)
Internal worker: monthly_salary / hours_per_month  (future — currently manual rate)

Overtime billing:  extra_hours × customer_rate  (included in Final Balance)
Overtime cost:     extra_hours × actual_cost_rate (included in ProjectLaborCost)
```

---

## Key File Locations

### Backend
```
app/Actions/Project/
  CreateProjectWorkerSlotsAction.php  ← auto-creates slots on quote conversion
  AssignWorkerToSlotAction.php        ← assigns worker to slot
  CreateWorkerScheduleAction.php      ← creates schedule days
  LogLaborHoursAction.php             ← worker submits hours
  ApproveLaborLogAction.php           ← PM approves → creates cost
  RejectLaborLogAction.php
  CreateProjectExpenseAction.php      ← auto-approve logic
  ApproveProjectExpenseAction.php
  RejectProjectExpenseAction.php

app/Services/FinalBalanceService.php  ← computes full report (no DB writes)

app/Models/
  ProjectWorkerSchedule.php
  ProjectLaborLog.php
  ProjectExpense.php

app/Data/
  ProjectWorkerScheduleData.php
  ProjectLaborLogData.php
  ProjectExpenseData.php
  FinalBalanceData.php

app/Listeners/CreateLaborSlotsFromQuoteListener.php
app/Events/LaborLogApproved.php
app/Events/ProjectExpenseApproved.php
```

### Frontend
```
lib/api/
  project-labor-logs.ts
  project-expenses.ts

app/(dashboard)/projects/_components/
  project-labor-slots-section.tsx    ← Personale tab: unassigned slots + assign dialog
  project-labor-logs-section.tsx     ← Ore tab: approve/reject hours
  project-expenses-section.tsx       ← Spese tab: approve/reject expenses
  project-final-balance-tab.tsx      ← Final Balance tab
  project-worker-status-badge.tsx    ← updated with 'slot' status
```

---

## Next Steps (Priority Order)

1. **[HIGH]** Add project settings to SettingSeeder (`expense_auto_approve_threshold`, `hours_per_day`)
2. **[HIGH]** Build Gap 3: `submit-expense-dialog.tsx` with "Aggiungi Spesa" button in ProjectExpensesSection
3. **[HIGH]** Build Gap 2: Worker labor log submission form (from their project view or worker dashboard)
4. **[MEDIUM]** Build Gap 1: Assignment acceptance page `/assignments/[id]/page.tsx`
5. **[MEDIUM]** Build Gap 4: Schedule management dialog for event projects
6. **[LOW]** Build Gap 5: Worker mobile dashboard with full assignment/scheduling/hours UI
