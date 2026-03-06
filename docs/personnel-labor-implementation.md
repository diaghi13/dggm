# Personnel & Labor Management — Complete Implementation Plan

**Feature**: Quote labor items → Project worker slots → Assignment → Scheduling → Hour logging → Expenses → Final Balance
**Version**: 1.0
**Date**: March 2026
**Status**: Planning — Ready to implement

---

## ⚠️ MANDATORY PRE-IMPLEMENTATION RULES

### Rule 1 — Always check what already exists

> **Before writing ANY code for each phase, always verify what already exists.**
> The codebase has been evolving rapidly. Several components may be partially implemented.
> Check: models, migrations, controllers, actions, events, listeners, frontend components, API routes.
> Do NOT duplicate existing code — extend and complete it instead.

**Key files to check before starting each phase:**
- `app/Models/ProjectWorker.php` — fields may already be added
- `app/Models/ProjectLaborCost.php` — partially covers labor logging
- `app/Actions/Project/` — some actions may exist
- `app/Events/` + `app/Listeners/` — check EventServiceProvider
- `routes/api.php` — some routes may already be registered
- `database/migrations/` — check for existing migrations with similar names

### Rule 2 — Always use subagents

> **Use subagents (Task tool) for all non-trivial work within each phase.**
> Never attempt to explore, read, and implement everything in a single context — it leads to missed files and duplicated code.

**Mandatory subagent usage:**

| When | Use subagent for |
|---|---|
| **Before any phase** | Explore agent to scan all relevant existing files |
| **Codebase research** | Explore agent — glob patterns, grep across multiple dirs |
| **Parallel independent work** | Multiple agents in parallel (e.g. migrations + enums simultaneously) |
| **Large file reads** | Explore agent to summarize, not read everything inline |
| **Frontend + backend in same sprint** | Separate agents running in parallel |
| **Checking for duplicates** | Explore agent before creating any new file |

**Example pattern for each sprint:**
```
1. Launch Explore agent → "scan app/Actions/Project/, app/Models/, routes/api.php
                           and tell me what already exists for [feature]"
2. Review findings
3. Launch implementation (inline or subagent for large tasks)
4. Launch Explore agent to verify no duplicates were created
```

---

## Context & Business Logic

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
  Tecnico Ledwall  qty:1  billing:day  duration:2d  unit_price:280€/d  cost_price:160€/d
  Facchino         qty:2  billing:day  duration:1d  unit_price:150€/d  cost_price:90€/d
                                                      ↓
                                     Revenue: 2.160€  /  Cost estimate: 1.320€
```

### Internal vs External Workers

| | External (freelancer/collaborators) | Internal (employees) |
|---|---|---|
| **Cost source** | `WorkerRate` (InternalCost context) | Monthly salary ÷ hours/month setting |
| **Cost tracking** | Full cost-per-project | Calculated from payroll data |
| **Overtime cost** | rate × `overtime_multiplier` from WorkerRate | rate × multiplier (internal setting) |
| **Acceptance flow** | Required (Pending → accept/reject) | Direct assignment (Active) |
| **Complexity** | Full rate calculation | Simpler — uses payroll rate |

### Cost Calculation Formulas

```
External worker:
  Regular cost   = hours × actual_cost_rate
  Overtime cost  = overtime_hours × actual_cost_rate × overtime_multiplier

Internal worker:
  Regular cost   = hours × (monthly_salary / hours_per_month_setting)
  Overtime cost  = overtime_hours × hourly_rate × overtime_multiplier

Customer billing (extra hours in Final Balance):
  Extra revenue  = extra_hours × (customer_rate / hours_per_day) × [overtime_multiplier if OT]
```

### Timbratura (GPS Clock-in/out)

> **FUTURE FEATURE** — Not in this sprint.
> `ProjectLaborCost.time_entry_id` FK already exists for future connection.
> `Coordinates` ValueObject is already implemented for GPS validation.
> For now: workers log hours **manually** via `ProjectLaborLog`.

---

## Complete Data Flow

```
QUOTE
├── QuoteItem[labor] ── unit_price (customer), cost_price (budget estimate)
│
└── [Approved + Converted to Project]
         ↓
PROJECT
├── ProjectWorker[slot] ── NULL worker, status='slot', from quote_item
│        │
│        └── [PM assigns worker]
│                 ↓
│        ProjectWorker[assigned]
│        ├── actual_cost_rate ← auto-pulled from WorkerRate
│        ├── is_external
│        └── status: pending → [worker accepts] → accepted → active
│                 ↓
│        ProjectWorkerSchedule (for event-type only)
│        ├── scheduled_date + planned_start_time + planned_end_time
│        └── status: pending → [worker accepts day] → accepted
│                 ↓
│        ProjectLaborLog (worker submits hours)
│        ├── regular_hours, overtime_hours, log_date
│        └── status: pending → [PM approves] → approved
│                 ↓ (on approval)
│        ProjectLaborCost (auto-created)
│        ├── External: hours × actual_cost_rate [× overtime_multiplier]
│        └── Internal: hours × (monthly_salary ÷ hours_per_month)
│
├── ProjectExpense (anyone on project)
│   ├── submitted_by_user_id (PM, admin, or worker)
│   ├── project_worker_id nullable (attribution)
│   ├── is_billable_to_client
│   └── status: pending → auto-approve (< threshold) or PM approval
│
└── MaterialRequest (already implemented ✓)
         ↓
FINAL BALANCE (ConsuntivoService — calculated, not stored)
├── Approved quote total          ← base
├── Extra materials used          ← approved MaterialRequests beyond quote
├── Extra labor hours             ← approved ProjectLaborLog hours > estimate × customer_rate
├── Billable expenses             ← approved ProjectExpense where is_billable_to_client=true
└── ─────────────────────────────────────────────────────
    Total to bill to client

    Internal analysis (not shown to client):
    ├── Total revenue
    ├── Total cost (labor + expenses)
    ├── Margin per role / per project
    └── Budget vs actual variance
```

---

## Phase A — Database Migrations

> **Check first**: Run `php artisan migrate:status` and review existing migration files
> before creating any new migration to avoid duplicates.

### A.1 — `add_cost_price_to_quote_items`

```php
Schema::table('quote_items', function (Blueprint $table) {
    $table->decimal('cost_price', 10, 2)->nullable()->after('unit_price');
    // budget estimate for labor items (internal use, not shown to client)
});
```

### A.2 — `add_labor_fields_to_project_workers`

> **Check first**: Read current `project_workers` table schema.
> Some fields (`estimated_hours`, `hourly_rate_override`) already exist — do NOT re-add.

```php
Schema::table('project_workers', function (Blueprint $table) {
    // Slot management
    $table->string('role_name')->nullable()->after('status');
    $table->unsignedTinyInteger('slot_index')->default(1)->after('role_name');
    $table->foreignId('quote_item_id')
          ->nullable()->after('slot_index')
          ->constrained('quote_items')->nullOnDelete();

    // Rate tracking
    $table->decimal('estimated_days', 8, 2)->nullable();
    $table->decimal('budget_cost_rate', 10, 2)->nullable();  // from quote cost_price
    $table->decimal('actual_cost_rate', 10, 2)->nullable();  // from WorkerRate on assignment
    $table->decimal('customer_rate', 10, 2)->nullable();     // from quote unit_price

    // Worker type flag
    $table->boolean('is_external')->default(false);
    $table->boolean('is_scheduled')->default(false); // uses work schedule (event mode)
});
```

> **Note on `status` enum**: MySQL enums require a separate migration to add 'slot' value.
> Check if your status column is enum or string — if string, no migration needed, just update the PHP enum.

### A.3 — `create_project_worker_schedules`

```php
Schema::create('project_worker_schedules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_worker_id')->constrained()->cascadeOnDelete();
    $table->date('scheduled_date');
    $table->time('planned_start_time')->nullable();
    $table->time('planned_end_time')->nullable();
    $table->decimal('planned_hours', 5, 2)->nullable(); // computed from start-end, or manual
    $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
    $table->timestamp('accepted_at')->nullable();
    $table->timestamp('rejected_at')->nullable();
    $table->text('rejection_reason')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();

    $table->unique(['project_worker_id', 'scheduled_date']); // one record per worker per day
});
```

### A.4 — `create_project_labor_logs`

> **Check first**: `ProjectLaborCost` already handles post-work recording.
> `ProjectLaborLog` is the PRE-APPROVAL submission layer (worker submits → PM approves → cost created).
> These are complementary, not duplicates.

```php
Schema::create('project_labor_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->foreignId('project_worker_id')->constrained()->cascadeOnDelete();
    $table->foreignId('worker_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('schedule_day_id')
          ->nullable()
          ->references('id')->on('project_worker_schedules')
          ->nullOnDelete();
    $table->date('log_date');
    $table->decimal('regular_hours', 5, 2)->default(0);
    $table->decimal('overtime_hours', 5, 2)->default(0);
    $table->text('description')->nullable();
    $table->foreignId('submitted_by_user_id')->constrained('users');
    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
    $table->foreignId('approved_by_user_id')->nullable()->constrained('users');
    $table->timestamp('approved_at')->nullable();
    $table->text('rejection_reason')->nullable();
    // Link to auto-generated cost (set on approval)
    $table->foreignId('labor_cost_id')
          ->nullable()
          ->references('id')->on('project_labor_costs')
          ->nullOnDelete();
    $table->timestamps();

    $table->unique(['project_worker_id', 'log_date']); // one log per worker per day
});
```

### A.5 — `create_project_expenses`

```php
Schema::create('project_expenses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('project_id')->constrained()->cascadeOnDelete();
    $table->foreignId('project_worker_id')->nullable()->constrained()->nullOnDelete();
    // ^ nullable: expenses can be project-level (PM adds hotel) or worker-level
    $table->foreignId('submitted_by_user_id')->constrained('users');
    $table->enum('category', ['fuel', 'food', 'accommodation', 'transport', 'tools', 'other']);
    $table->string('description');
    $table->decimal('amount', 10, 2);
    $table->date('expense_date');
    $table->boolean('is_billable_to_client')->default(false);
    $table->unsignedBigInteger('receipt_media_id')->nullable();
    // ^ FK to media table — check exact table name in your media setup
    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
    $table->foreignId('approved_by_user_id')->nullable()->constrained('users');
    $table->timestamp('approved_at')->nullable();
    $table->text('rejection_reason')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

### A.6 — `add_billing_unit_default_to_products`

> **Check first**: Does `products` table already have this column? Check existing migrations.

```php
Schema::table('products', function (Blueprint $table) {
    $table->string('billing_unit_default')->nullable()->after('type');
    // Examples: 'day' for "Fonico", 'hour' for "Consulenza", 'flat' for "Trasporto"
    // Only meaningful for products with type='service'
});
```

### A.7 — Settings (Seeder update only, no migration)

> Add to `SettingSeeder.php` — check for existing keys before adding:

```php
// group: project
['group' => 'project', 'key' => 'project.schedule_change_behavior',
 'value' => 'require_acceptance', // or 'notify_only'
 'type' => 'select', 'description' => 'Comportamento modifica piano di lavoro'],

['group' => 'project', 'key' => 'project.expense_auto_approve_threshold',
 'value' => '50', 'type' => 'number',
 'description' => 'Soglia auto-approvazione spese (€)'],

['group' => 'project', 'key' => 'project.hours_per_month_internal',
 'value' => '160', 'type' => 'number',
 'description' => 'Ore mensili lavoratori interni (per calcolo costo orario)'],

['group' => 'project', 'key' => 'project.hours_per_day',
 'value' => '8', 'type' => 'number',
 'description' => 'Ore standard per giornata lavorativa'],
```

---

## Phase B — Enums

> **Check first**: Read all existing enum files in `app/Enums/` before modifying.

### B.1 — Update `ProjectWorkerStatus`

```php
// Add to existing enum:
case Slot = 'slot'; // Role defined, no worker assigned yet

// Update label() / description() methods accordingly
```

### B.2 — New: `ProjectExpenseCategory`

```php
// app/Enums/ProjectExpenseCategory.php
enum ProjectExpenseCategory: string
{
    case Fuel = 'fuel';
    case Food = 'food';
    case Accommodation = 'accommodation';
    case Transport = 'transport';
    case Tools = 'tools';
    case Other = 'other';

    public function label(): string { ... }
    public function icon(): string { ... }
}
```

### B.3 — New: `ProjectScheduleDayStatus`

```php
// app/Enums/ProjectScheduleDayStatus.php
enum ProjectScheduleDayStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
}
```

---

## Phase C — Models

> **Check first**: Read the current model files fully before adding any fields or relationships.

### C.1 — Update `QuoteItem`

```php
// Add to $fillable:
'cost_price',

// Add computed accessors:
public function getTotalCostAttribute(): float
{
    // mirrors total calculation but using cost_price
    return match($this->billing_unit) {
        'flat'  => $this->cost_price ?? 0,
        'unit'  => ($this->quantity ?? 0) * ($this->cost_price ?? 0),
        default => ($this->quantity ?? 0) * ($this->cost_price ?? 0) * ($this->duration ?? 1),
    };
}

public function getMarginAttribute(): float
{
    return $this->total - $this->total_cost;
}

public function getMarginPercentageAttribute(): ?float
{
    return $this->total > 0 ? ($this->margin / $this->total) * 100 : null;
}
```

### C.2 — Update `ProjectWorker`

```php
// Add to $fillable:
'role_name', 'slot_index', 'quote_item_id',
'estimated_days', 'budget_cost_rate', 'actual_cost_rate', 'customer_rate',
'is_external', 'is_scheduled',

// Add relationships:
public function quoteItem(): BelongsTo
{
    return $this->belongsTo(QuoteItem::class);
}

public function scheduleDays(): HasMany
{
    return $this->hasMany(ProjectWorkerSchedule::class);
}

public function laborLogs(): HasMany
{
    return $this->hasMany(ProjectLaborLog::class);
}

// Add scopes:
public function scopeSlots(Builder $query): Builder
{
    return $query->where('status', ProjectWorkerStatus::Slot);
}

public function scopeAssigned(Builder $query): Builder
{
    return $query->whereNotIn('status', [ProjectWorkerStatus::Slot])
                 ->whereNotNull('worker_id');
}

// Add accessors:
public function getIsSlotAttribute(): bool
{
    return $this->status === ProjectWorkerStatus::Slot;
}

public function getBudgetTotalCostAttribute(): float
{
    return ($this->estimated_days ?? 0) * ($this->budget_cost_rate ?? 0);
}

public function getActualTotalCostAttribute(): float
{
    return $this->laborLogs()->approved()->sum(
        DB::raw('regular_hours * ' . ($this->actual_cost_rate / 8) . ' + overtime_hours * ' . ($this->actual_cost_rate / 8 * $this->overtimeMultiplier))
    );
}
```

### C.3 — Update `Product`

```php
// Add to $fillable:
'billing_unit_default',

// Add accessor:
public function getIsServiceAttribute(): bool
{
    return $this->type === 'service'; // check actual enum value
}
```

### C.4 — New: `ProjectWorkerSchedule`

```php
// app/Models/ProjectWorkerSchedule.php
class ProjectWorkerSchedule extends Model
{
    protected $fillable = [
        'project_worker_id', 'scheduled_date',
        'planned_start_time', 'planned_end_time', 'planned_hours',
        'status', 'accepted_at', 'rejected_at', 'rejection_reason', 'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'accepted_at'    => 'datetime',
        'rejected_at'    => 'datetime',
        'status'         => ProjectScheduleDayStatus::class,
    ];

    public function projectWorker(): BelongsTo { ... }
    public function laborLog(): HasOne { return $this->hasOne(ProjectLaborLog::class, 'schedule_day_id'); }

    public function scopePending(Builder $q): Builder { return $q->where('status', 'pending'); }
    public function scopeAccepted(Builder $q): Builder { return $q->where('status', 'accepted'); }
    public function scopeForDate(Builder $q, Carbon $date): Builder { return $q->whereDate('scheduled_date', $date); }
    public function scopeUpcoming(Builder $q): Builder { return $q->where('scheduled_date', '>=', today()); }

    public function getPlannedHoursComputedAttribute(): float
    {
        if ($this->planned_hours) return $this->planned_hours;
        if ($this->planned_start_time && $this->planned_end_time) {
            // calculate from start/end times
        }
        return 8.0; // default
    }
}
```

### C.5 — New: `ProjectLaborLog`

```php
// app/Models/ProjectLaborLog.php
class ProjectLaborLog extends Model
{
    protected $fillable = [
        'project_id', 'project_worker_id', 'worker_id', 'schedule_day_id',
        'log_date', 'regular_hours', 'overtime_hours', 'description',
        'submitted_by_user_id', 'status',
        'approved_by_user_id', 'approved_at', 'rejection_reason', 'labor_cost_id',
    ];

    protected $casts = [
        'log_date'    => 'date',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function projectWorker(): BelongsTo { ... }
    public function worker(): BelongsTo { ... }
    public function project(): BelongsTo { ... }
    public function scheduleDay(): BelongsTo { return $this->belongsTo(ProjectWorkerSchedule::class, 'schedule_day_id'); }
    public function submittedBy(): BelongsTo { return $this->belongsTo(User::class, 'submitted_by_user_id'); }
    public function laborCost(): BelongsTo { return $this->belongsTo(ProjectLaborCost::class, 'labor_cost_id'); }

    // Scopes
    public function scopePending(Builder $q): Builder { return $q->where('status', 'pending'); }
    public function scopeApproved(Builder $q): Builder { return $q->where('status', 'approved'); }
    public function scopeForProject(Builder $q, int $projectId): Builder { return $q->where('project_id', $projectId); }
    public function scopeByWorker(Builder $q, int $workerId): Builder { return $q->where('worker_id', $workerId); }

    // Accessors
    public function getTotalHoursAttribute(): float
    {
        return $this->regular_hours + $this->overtime_hours;
    }
}
```

### C.6 — New: `ProjectExpense`

```php
// app/Models/ProjectExpense.php
class ProjectExpense extends Model
{
    protected $fillable = [
        'project_id', 'project_worker_id', 'submitted_by_user_id',
        'category', 'description', 'amount', 'expense_date',
        'is_billable_to_client', 'receipt_media_id',
        'status', 'approved_by_user_id', 'approved_at',
        'rejection_reason', 'notes',
    ];

    protected $casts = [
        'expense_date'         => 'date',
        'approved_at'          => 'datetime',
        'is_billable_to_client'=> 'boolean',
        'category'             => ProjectExpenseCategory::class,
    ];

    // Relationships
    public function project(): BelongsTo { ... }
    public function projectWorker(): BelongsTo { ... }
    public function submittedBy(): BelongsTo { return $this->belongsTo(User::class, 'submitted_by_user_id'); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class, 'approved_by_user_id'); }

    // Scopes
    public function scopeBillable(Builder $q): Builder { return $q->where('is_billable_to_client', true); }
    public function scopePending(Builder $q): Builder { return $q->where('status', 'pending'); }
    public function scopeApproved(Builder $q): Builder { return $q->where('status', 'approved'); }
    public function scopeForProject(Builder $q, int $projectId): Builder { return $q->where('project_id', $projectId); }

    // Methods
    public function approve(User $approver): void
    {
        $this->update(['status' => 'approved', 'approved_by_user_id' => $approver->id, 'approved_at' => now()]);
    }

    public function reject(User $approver, string $reason): void
    {
        $this->update(['status' => 'rejected', 'approved_by_user_id' => $approver->id, 'rejection_reason' => $reason]);
    }
}
```

---

## Phase D — Spatie Data DTOs

> **Check first**: Read existing Data classes before creating new ones.
> `QuoteItemData`, `ProjectWorkerData` already exist — update them, don't recreate.

### D.1 — Update `QuoteItemData`

```php
// Add field:
public ?float $cost_price = null,

// Add computed (output only):
public float|Optional $total_cost = new Optional,
public float|Optional $margin = new Optional,
public float|Optional $margin_percentage = new Optional,
```

### D.2 — Update `ProjectWorkerData`

```php
// Add fields:
public ?string $role_name = null,
public int $slot_index = 1,
public ?int $quote_item_id = null,
public ?float $estimated_days = null,
public ?float $budget_cost_rate = null,
public ?float $actual_cost_rate = null,
public ?float $customer_rate = null,
public bool $is_external = false,
public bool $is_scheduled = false,

// Add relationships (output only):
public DataCollection|Lazy|Optional $scheduleDays = new Optional,
public DataCollection|Lazy|Optional $laborLogs = new Optional,
```

### D.3 — New: `ProjectWorkerScheduleData`

```php
public function __construct(
    public int|Optional $id = new Optional,
    #[Required] public int $project_worker_id,
    #[Required] public Carbon $scheduled_date,
    public ?string $planned_start_time = null,
    public ?string $planned_end_time = null,
    public ?float $planned_hours = null,
    public string $status = 'pending',
    public ?string $rejection_reason = null,
    public ?string $notes = null,
    // output
    public Carbon|Optional $accepted_at = new Optional,
    public Carbon|Optional $rejected_at = new Optional,
)
```

### D.4 — New: `ProjectLaborLogData`

```php
public function __construct(
    public int|Optional $id = new Optional,
    #[Required] public int $project_id,
    #[Required] public int $project_worker_id,
    public ?int $schedule_day_id = null,
    #[Required] public Carbon $log_date,
    public float $regular_hours = 0,
    public float $overtime_hours = 0,
    public ?string $description = null,
    public string $status = 'pending',
    public ?string $rejection_reason = null,
    // output only
    public float|Optional $total_hours = new Optional,
    public float|Optional $cost_amount = new Optional,
    public float|Optional $revenue_amount = new Optional,
)
```

### D.5 — New: `ProjectExpenseData`

```php
public function __construct(
    public int|Optional $id = new Optional,
    #[Required] public int $project_id,
    public ?int $project_worker_id = null,
    #[Required] public ProjectExpenseCategory $category,
    #[Required] public string $description,
    #[Required] public float $amount,
    #[Required] public Carbon $expense_date,
    public bool $is_billable_to_client = false,
    public ?int $receipt_media_id = null,
    public ?string $notes = null,
    public string $status = 'pending',
    public ?string $rejection_reason = null,
    // output
    public UserData|Lazy|Optional $submittedBy = new Optional,
)
```

### D.6 — New: `FinalBalanceData` (Consuntivo)

```php
public function __construct(
    // Base quote
    public float $quote_total,
    public string $quote_code,
    public string $quote_title,

    // Sections (document-style, Option B)
    /** @var DataCollection<FinalBalanceSectionData> */
    public DataCollection $sections,

    // Extras
    /** @var DataCollection<FinalBalanceExtraLineData> */
    public DataCollection $extra_materials,
    /** @var DataCollection<FinalBalanceExtraLineData> */
    public DataCollection $extra_labor,
    /** @var DataCollection<FinalBalanceExtraLineData> */
    public DataCollection $extra_expenses,

    // Totals
    public float $extras_total,
    public float $total_to_bill,

    // Internal analysis (not in PDF client section)
    public float $total_revenue,
    public float $total_cost,
    public float $margin,
    public float $margin_percentage,
    public float $budget_variance, // actual_cost - budget_cost
)
```

---

## Phase E — Actions

> **Check first**: Look in `app/Actions/Project/` for any existing actions that may overlap.
> `AddLaborCostAction` exists — reuse it in `ApproveLaborLogAction`.

### E.1 — Update `ConvertQuoteToProjectAction`

> **Check first**: Read the full current implementation of this action.
> Locate where `createProjectProducts()` is called and add slot creation after it.

```php
// After creating project materials from items, add:
app(CreateProjectWorkerSlotsAction::class)->execute($project, $quote);
```

### E.2 — New: `CreateProjectWorkerSlotsAction`

```php
// app/Actions/Project/CreateProjectWorkerSlotsAction.php
class CreateProjectWorkerSlotsAction
{
    public function execute(Project $project, Quote $quote): void
    {
        $laborItems = $quote->items()
            ->where('type', QuoteItemType::Labor->value)
            ->get();

        foreach ($laborItems as $item) {
            $quantity = (int) ($item->quantity ?? 1);

            for ($i = 1; $i <= $quantity; $i++) {
                ProjectWorker::create([
                    'project_id'       => $project->id,
                    'worker_id'        => null,
                    'status'           => ProjectWorkerStatus::Slot->value,
                    'quote_item_id'    => $item->id,
                    'role_name'        => $item->description,
                    'slot_index'       => $i,
                    'estimated_days'   => $item->duration ?? $quote->event_days,
                    'budget_cost_rate' => $item->cost_price,
                    'customer_rate'    => $item->unit_price,
                    'is_external'      => false, // updated on worker assignment
                    'is_scheduled'     => $quote->quote_type === QuoteType::Event,
                ]);
            }
        }
    }
}
```

### E.3 — New: `AssignWorkerToSlotAction`

```php
// app/Actions/Project/AssignWorkerToSlotAction.php
class AssignWorkerToSlotAction
{
    public function __construct(
        private readonly RateCalculationService $rateService
    ) {}

    public function execute(ProjectWorker $slot, Worker $worker, array $options = []): ProjectWorker
    {
        return DB::transaction(function () use ($slot, $worker, $options) {
            // Pull actual cost rate from WorkerRate
            $rate = $this->rateService->getCurrentRate(
                $worker,
                RateContext::InternalCost,
                RateType::Daily
            );

            $isExternal = $worker->worker_type !== WorkerType::Employee;

            $slot->update([
                'worker_id'        => $worker->id,
                'actual_cost_rate' => $rate?->rate_amount,
                'is_external'      => $isExternal,
                'status'           => $isExternal
                    ? ProjectWorkerStatus::Pending->value   // needs acceptance
                    : ProjectWorkerStatus::Active->value,   // internal: direct active
                'assigned_from'    => $options['assigned_from'] ?? now()->toDateString(),
                'assigned_to'      => $options['assigned_to'] ?? null,
                'notes'            => $options['notes'] ?? null,
            ]);

            WorkerAssignedToProject::dispatch($slot, auth()->user());

            return $slot->fresh();
        });
    }
}
```

### E.4 — New: `CreateWorkerScheduleAction`

```php
// app/Actions/Project/CreateWorkerScheduleAction.php
// PM creates/updates work schedule for an assigned worker slot
class CreateWorkerScheduleAction
{
    public function execute(ProjectWorker $slot, array $days): Collection
    {
        return DB::transaction(function () use ($slot, $days) {
            $behavior = Setting::get('project.schedule_change_behavior', 'require_acceptance');
            $created = collect();

            foreach ($days as $day) {
                $existing = $slot->scheduleDays()
                    ->whereDate('scheduled_date', $day['scheduled_date'])
                    ->first();

                if ($existing) {
                    // Already accepted: keep it, notify of time change only
                    if ($existing->status === 'accepted') {
                        $existing->update([
                            'planned_start_time' => $day['planned_start_time'] ?? null,
                            'planned_end_time'   => $day['planned_end_time'] ?? null,
                            'notes'              => $day['notes'] ?? null,
                        ]);
                        WorkerScheduleUpdated::dispatch($slot, $existing, 'time_updated');
                    }
                } else {
                    $schedule = $slot->scheduleDays()->create([
                        'scheduled_date'   => $day['scheduled_date'],
                        'planned_start_time' => $day['planned_start_time'] ?? null,
                        'planned_end_time'   => $day['planned_end_time'] ?? null,
                        'planned_hours'      => $day['planned_hours'] ?? null,
                        'notes'              => $day['notes'] ?? null,
                        'status'             => $behavior === 'require_acceptance'
                            ? 'pending'
                            : 'accepted', // auto-accept if setting = notify_only
                    ]);

                    WorkerScheduleUpdated::dispatch($slot, $schedule, 'day_added');
                    $created->push($schedule);
                }
            }

            return $created;
        });
    }
}
```

### E.5 — New: `LogLaborHoursAction`

```php
// app/Actions/Project/LogLaborHoursAction.php
class LogLaborHoursAction
{
    public function execute(ProjectLaborLogData $data): ProjectLaborLog
    {
        $log = ProjectLaborLog::create([
            ...$data->toArray(),
            'submitted_by_user_id' => auth()->id(),
            'status'               => 'pending',
        ]);

        LaborLogSubmitted::dispatch($log);

        return $log;
    }
}
```

### E.6 — New: `ApproveLaborLogAction`

```php
// app/Actions/Project/ApproveLaborLogAction.php
class ApproveLaborLogAction
{
    public function __construct(
        private readonly RateCalculationService $rateService
    ) {}

    public function execute(ProjectLaborLog $log): ProjectLaborCost
    {
        return DB::transaction(function () use ($log) {
            $slot = $log->projectWorker;
            $worker = $log->worker;

            // Calculate cost based on external/internal
            if ($slot->is_external && $worker) {
                $costRate   = $slot->actual_cost_rate ?? 0;
                $hourlyRate = $costRate / Setting::get('project.hours_per_day', 8);
                $otMultiplier = $this->getOvertimeMultiplier($worker);
            } else {
                // Internal: monthly salary ÷ hours_per_month
                $monthlySalary = $this->rateService->getCurrentRate(
                    $worker, RateContext::Payroll, RateType::Monthly
                )?->rate_amount ?? 0;
                $hoursPerMonth = Setting::get('project.hours_per_month_internal', 160);
                $hourlyRate   = $monthlySalary / $hoursPerMonth;
                $otMultiplier = 1.5; // or from settings
            }

            $regularCost  = $log->regular_hours  * $hourlyRate;
            $overtimeCost = $log->overtime_hours * $hourlyRate * $otMultiplier;
            $totalCost    = $regularCost + $overtimeCost;

            // Create ProjectLaborCost via existing action
            $laborCost = app(AddLaborCostAction::class)->execute(new ProjectLaborCostData(
                project_id:   $log->project_id,
                worker_id:    $log->worker_id,
                cost_type:    $slot->is_external ? LaborCostType::Subcontractor : LaborCostType::InternalLabor,
                description:  $log->description ?? "Log {$log->log_date->format('d/m/Y')}",
                work_date:    $log->log_date,
                hours_worked: $log->total_hours,
                unit_rate:    $hourlyRate,
                total_cost:   $totalCost,
                is_overtime:  $log->overtime_hours > 0,
            ));

            $log->update([
                'status'              => 'approved',
                'approved_by_user_id' => auth()->id(),
                'approved_at'         => now(),
                'labor_cost_id'       => $laborCost->id,
            ]);

            LaborLogApproved::dispatch($log, $laborCost);

            // Check if hours exceed estimate and alert PM
            $this->checkBudgetAlert($log, $slot);

            return $laborCost;
        });
    }

    private function checkBudgetAlert(ProjectLaborLog $log, ProjectWorker $slot): void
    {
        $totalLoggedHours = $slot->laborLogs()->approved()->sum(
            DB::raw('regular_hours + overtime_hours')
        );
        $estimatedHours = ($slot->estimated_days ?? 0) * Setting::get('project.hours_per_day', 8);

        if ($totalLoggedHours > $estimatedHours) {
            LaborBudgetExceeded::dispatch($slot, $totalLoggedHours, $estimatedHours);
        }
    }
}
```

### E.7 — New: `CreateProjectExpenseAction`

```php
// app/Actions/Project/CreateProjectExpenseAction.php
class CreateProjectExpenseAction
{
    public function execute(ProjectExpenseData $data): ProjectExpense
    {
        return DB::transaction(function () use ($data) {
            $expense = ProjectExpense::create([
                ...$data->toArray(),
                'submitted_by_user_id' => auth()->id(),
                'status'               => 'pending',
            ]);

            $threshold = (float) Setting::get('project.expense_auto_approve_threshold', 50);

            if ($expense->amount <= $threshold) {
                $expense->approve(auth()->user());
                // No notification needed for auto-approved
            } else {
                ExpenseSubmitted::dispatch($expense);
                // Listener will notify PM
            }

            return $expense->fresh();
        });
    }
}
```

### E.8 — New: `ApproveProjectExpenseAction`

```php
// app/Actions/Project/ApproveProjectExpenseAction.php
class ApproveProjectExpenseAction
{
    public function execute(ProjectExpense $expense, bool $approve, ?string $reason = null): ProjectExpense
    {
        return DB::transaction(function () use ($expense, $approve, $reason) {
            if ($approve) {
                $expense->approve(auth()->user());
                ExpenseApproved::dispatch($expense);
            } else {
                $expense->reject(auth()->user(), $reason ?? '');
                ExpenseRejected::dispatch($expense);
            }

            return $expense->fresh();
        });
    }
}
```

---

## Phase F — Services

### F.1 — New: `FinalBalanceService`

```php
// app/Services/FinalBalanceService.php
// NO database operations — only calculations and aggregation
class FinalBalanceService
{
    public function calculate(Project $project): FinalBalanceData
    {
        $project->load([
            'quote.items',
            'workers.laborLogs' => fn($q) => $q->approved(),
            'workers.laborCosts',
            'expenses' => fn($q) => $q->approved(),
            'materials',
        ]);

        $quote = $project->quote;

        // 1. Build full document sections (Option B — complete document)
        $sections = $this->buildSections($quote, $project);

        // 2. Extra materials (beyond quote)
        $extraMaterials = $this->calculateExtraMaterials($project);

        // 3. Extra labor hours (beyond estimate) billed to client
        $extraLabor = $this->calculateExtraLaborRevenue($project);

        // 4. Billable expenses
        $extraExpenses = $this->calculateBillableExpenses($project);

        // 5. Totals
        $extrasTotal = $extraMaterials->sum('total')
                     + $extraLabor->sum('total')
                     + $extraExpenses->sum('total');

        // 6. Internal cost analysis
        $totalRevenue = ($quote->total_amount ?? 0) + $extrasTotal;
        $totalCost    = $this->calculateTotalInternalCost($project);
        $margin       = $totalRevenue - $totalCost;

        return FinalBalanceData::from([
            'quote_total'       => $quote->total_amount ?? 0,
            'quote_code'        => $quote->code,
            'quote_title'       => $quote->title,
            'sections'          => $sections,
            'extra_materials'   => $extraMaterials,
            'extra_labor'       => $extraLabor,
            'extra_expenses'    => $extraExpenses,
            'extras_total'      => $extrasTotal,
            'total_to_bill'     => ($quote->total_amount ?? 0) + $extrasTotal,
            'total_revenue'     => $totalRevenue,
            'total_cost'        => $totalCost,
            'margin'            => $margin,
            'margin_percentage' => $totalRevenue > 0 ? ($margin / $totalRevenue) * 100 : 0,
            'budget_variance'   => $totalCost - $this->calculateBudgetCost($project),
        ]);
    }

    private function calculateExtraLaborRevenue(Project $project): Collection
    {
        // For each worker slot: compare actual hours vs estimated
        // Extra hours × (customer_rate / hours_per_day) × [overtime_multiplier if OT]
        ...
    }

    private function calculateTotalInternalCost(Project $project): float
    {
        return $project->laborCosts()->sum('total_cost')
             + $project->expenses()->approved()->sum('amount');
    }
}
```

---

## Phase G — Events & Listeners

> **Check first**: Read `EventServiceProvider.php` fully before adding.
> `WorkerAssignedToProject` notification/event may already exist — verify.

### New Events

```php
WorkerScheduleUpdated::class       // PM changes schedule
ScheduleDayRejected::class         // worker rejects a scheduled day
LaborLogSubmitted::class           // worker submits hours
LaborLogApproved::class            // PM approves hours log
LaborLogRejected::class            // PM rejects hours log
LaborBudgetExceeded::class         // actual hours > estimated hours
ExpenseSubmitted::class            // expense above auto-approve threshold
ExpenseApproved::class             // PM approves expense
ExpenseRejected::class             // PM rejects expense
```

### New Listeners

```php
// In EventServiceProvider::$listen:
WorkerScheduleUpdated::class => [
    NotifyWorkerOfScheduleChange::class,    // push/email to worker
],
ScheduleDayRejected::class => [
    NotifyPmOfDayRejection::class,
],
LaborLogSubmitted::class => [
    NotifyPmOfPendingLog::class,
],
LaborLogApproved::class => [
    NotifyWorkerOfLogApproval::class,
    // ProjectLaborCost already created in ApproveLaborLogAction
],
LaborLogRejected::class => [
    NotifyWorkerOfLogRejection::class,
],
LaborBudgetExceeded::class => [
    NotifyPmOfBudgetOverrun::class,
],
ExpenseSubmitted::class => [
    NotifyPmOfPendingExpense::class,
],
ExpenseApproved::class => [
    NotifyWorkerOfExpenseApproval::class,
],
ExpenseRejected::class => [
    NotifyWorkerOfExpenseRejection::class,
],
```

---

## Phase H — API Endpoints

> **Check first**: Read `routes/api.php` fully. Some project worker routes may already exist.
> Check `ProjectWorkerController`, `ProjectController` for existing methods.

### New Routes to Add

```php
// routes/api.php

// Worker Slots & Assignments
Route::get('/projects/{project}/workers', [ProjectWorkerController::class, 'index']);
Route::post('/projects/{project}/workers', [ProjectWorkerController::class, 'store']);
Route::put('/projects/{project}/workers/{projectWorker}/assign', [ProjectWorkerController::class, 'assign']);
Route::delete('/projects/{project}/workers/{projectWorker}', [ProjectWorkerController::class, 'destroy']);
Route::post('/projects/{project}/workers/{projectWorker}/accept', [ProjectWorkerController::class, 'accept']);  // worker accepts assignment
Route::post('/projects/{project}/workers/{projectWorker}/reject', [ProjectWorkerController::class, 'reject']);  // worker rejects assignment

// Work Schedule (Piano di Lavoro)
Route::prefix('project-workers/{projectWorker}/schedule')->group(function () {
    Route::get('/', [ProjectWorkerScheduleController::class, 'index']);
    Route::post('/', [ProjectWorkerScheduleController::class, 'store']);        // PM adds days (bulk)
    Route::put('/{schedule}', [ProjectWorkerScheduleController::class, 'update']);
    Route::delete('/{schedule}', [ProjectWorkerScheduleController::class, 'destroy']);
    Route::post('/{schedule}/accept', [ProjectWorkerScheduleController::class, 'accept']); // worker accepts day
    Route::post('/{schedule}/reject', [ProjectWorkerScheduleController::class, 'reject']); // worker rejects day
});

// Labor Logs
Route::prefix('projects/{project}/labor-logs')->group(function () {
    Route::get('/', [ProjectLaborLogController::class, 'index']);            // PM: all logs
    Route::post('/', [ProjectLaborLogController::class, 'store']);          // worker: submit hours
    Route::put('/{log}/approve', [ProjectLaborLogController::class, 'approve']); // PM
    Route::put('/{log}/reject', [ProjectLaborLogController::class, 'reject']);   // PM
});
Route::get('/my-labor-logs', [ProjectLaborLogController::class, 'myLogs']); // worker: own logs

// Expenses
Route::prefix('projects/{project}/expenses')->group(function () {
    Route::get('/', [ProjectExpenseController::class, 'index']);
    Route::post('/', [ProjectExpenseController::class, 'store']);
    Route::put('/{expense}/approve', [ProjectExpenseController::class, 'approve']);
    Route::put('/{expense}/reject', [ProjectExpenseController::class, 'reject']);
});
Route::get('/my-expenses', [ProjectExpenseController::class, 'myExpenses']);

// Final Balance
Route::get('/projects/{project}/final-balance', [FinalBalanceController::class, 'show']);
Route::get('/projects/{project}/final-balance/pdf', [FinalBalanceController::class, 'pdf']);
```

---

## Phase I — Policies

> **Check first**: Read existing `ProjectPolicy.php` and `ProjectWorkerPolicy.php` before creating new ones.

| Policy | view/viewAny | create | update | approve |
|---|---|---|---|---|
| `ProjectWorkerSchedule` | Project member | PM/Admin | PM/Admin | Worker (own) |
| `ProjectLaborLog` | Project member | Worker (own project) | Worker (pending own) | PM/Admin |
| `ProjectExpense` | Project member | Any project member | Submitter (pending) | PM/Admin |

---

## Phase J — Frontend Components

> **Check first**: Read existing components before creating new ones.
> `workers/[id]/page.tsx`, `dashboard/worker/page.tsx`, `projects/[id]/` — check what's already built.

### Extend Existing

- `components/quote-items/item-form-dialog.tsx`
  - Add `cost_price` field for `type=labor` items
  - Show margin preview: `(unit_price - cost_price) × qty × duration`
  - Auto-fill `duration` from quote's `event_days` (with override)
  - Auto-fill `cost_price` from selected service product's `cost`

### New Components

```
frontend/app/(dashboard)/projects/[id]/
├── _components/
│   ├── personnel-tab.tsx          → slots list, assign button, budget vs actual
│   ├── work-schedule-calendar.tsx → calendar view of scheduled days per worker
│   ├── labor-logs-tab.tsx         → PM: pending approval queue + history
│   └── expenses-tab.tsx           → PM: pending approval queue + history
│
└── final-balance/
    └── page.tsx                   → full consuntivo document + PDF button

frontend/app/(dashboard)/dashboard/worker/
├── _components/
│   ├── my-schedule.tsx            → upcoming scheduled days
│   ├── log-hours-dialog.tsx       → submit hours for a day
│   └── expense-dialog.tsx         → submit expense with receipt photo
│
└── page.tsx                       → EXTEND existing: add schedule + log sections

frontend/lib/api/
├── project-workers.ts             → EXTEND existing
├── project-schedule.ts            → NEW
├── project-labor-logs.ts          → NEW
├── project-expenses.ts            → NEW
└── final-balance.ts               → NEW
```

---

## Implementation Roadmap

### Sprint 1 — Core Data Model (Backend)
- [ ] Phase A: All migrations (A.1 → A.7)
- [ ] Phase B: All new enums
- [ ] Phase C: Update existing models + new models (C.1 → C.6)
- [ ] Phase D: Update/create all DTOs

### Sprint 2 — Business Logic (Backend)
- [ ] Phase E: All actions (E.1 → E.8) — verify ConvertQuoteToProjectAction first
- [ ] Phase F: FinalBalanceService
- [ ] Phase G: Events + Listeners (check EventServiceProvider first)
- [ ] Phase I: Policies (check existing policies first)

### Sprint 3 — API Layer (Backend)
- [ ] Phase H: New controllers + routes (read api.php first)
- [ ] Run: `./vendor/bin/pint` + `php artisan typescript:transform`

### Sprint 4 — Quote UI (Frontend)
- [ ] Extend quote item dialog: cost_price, margin preview, event_days auto-fill
- [ ] Service product selection for labor items

### Sprint 5 — Project Personnel UI (Frontend)
- [ ] Personnel tab: slots, assignment, budget vs actual
- [ ] Work schedule calendar

### Sprint 6 — Worker Dashboard (Frontend)
- [ ] My schedule view
- [ ] Log hours dialog
- [ ] Submit expense dialog

### Sprint 7 — PM Approval Flows (Frontend)
- [ ] Labor logs approval queue
- [ ] Expenses approval queue

### Sprint 8 — Final Balance (Frontend + Backend PDF)
- [ ] Final Balance view (complete document, Option B)
- [ ] PDF generation (extend PdfService / new template)

### Sprint 9 — Timbratura GPS (FUTURE)
- [ ] TimeEntry model (FK already in ProjectLaborCost)
- [ ] Clock-in/out API endpoints (GPS validation via Coordinates VO)
- [ ] Auto-generation of ProjectLaborLog from TimeEntry on clock-out
- [ ] Mobile app API endpoints

---

## Key Dependencies Map

```
QuoteItem.cost_price
  └── required by: FinalBalanceService (budget calculation)

CreateProjectWorkerSlotsAction
  └── requires: ConvertQuoteToProjectAction (call point)
  └── requires: ProjectWorkerStatus::Slot enum value

AssignWorkerToSlotAction
  └── requires: RateCalculationService (already exists)
  └── requires: WorkerRate records to exist for workers

ApproveLaborLogAction
  └── requires: AddLaborCostAction (already exists)
  └── requires: RateCalculationService (already exists)
  └── requires: project.hours_per_month_internal setting

FinalBalanceService
  └── requires: ProjectLaborCost (already exists)
  └── requires: ProjectExpense (new)
  └── requires: MaterialRequest.approved status (check existing)
```

---

## Notes & Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Cost in quote | Optional `cost_price` field | Budget estimate before worker assigned |
| Real cost | From `WorkerRate` at assignment time | Actual cost depends on who is assigned |
| Internal workers | Monthly salary ÷ hours_per_month | Tracked for project cost analysis |
| GPS timbratura | Future feature | Architecture ready (TimeEntry FK, Coordinates VO) |
| Final Balance | Option B (full document) | More professional for client presentation |
| Schedule changes | Configurable (notify or re-accept) | Flexible per company preference |
| Expense approval | Auto-approve below threshold | Reduces PM workload for small amounts |
| qty>1 labor items | Create N separate slots | One worker per slot — clear assignment |
| "Piano di lavoro" | Date + start/end time per day | Clock-in/out (timbratura) is future |
| Consuntivo name | **Final Balance** | English consistency |

---

*Document generated: March 2026 — Update as implementation progresses*
