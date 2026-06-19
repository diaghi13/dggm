<?php

namespace App\Domains\Project\Models;

use App\Domains\Quote\Models\QuoteItem;
use App\Enums\ProjectWorkerStatus;
use App\Models\User;
use App\Models\Worker;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectWorker extends Model
{
    use HasFactory;

    protected $table = 'project_workers';

    public $incrementing = true;

    protected $fillable = [
        'project_id',
        'worker_id',
        'status',
        'assigned_by_user_id',
        'site_role',
        'assigned_from',
        'assigned_to',
        'responded_at',
        'response_due_at',
        'rejection_reason',
        'hourly_rate_override',
        'fixed_rate_override',
        'rate_override_notes',
        'estimated_hours',
        'is_active',
        'notes',
        'role_name',
        'slot_index',
        'quote_item_id',
        'estimated_days',
        'budget_cost_rate',
        'actual_cost_rate',
        'customer_rate',
        'is_external',
        'is_scheduled',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectWorkerStatus::class,
            'assigned_from' => 'date',
            'assigned_to' => 'date',
            'responded_at' => 'datetime',
            'response_due_at' => 'datetime',
            'hourly_rate_override' => 'decimal:2',
            'fixed_rate_override' => 'decimal:2',
            'estimated_hours' => 'decimal:2',
            'is_active' => 'boolean',
            'slot_index' => 'integer',
            'estimated_days' => 'decimal:2',
            'budget_cost_rate' => 'decimal:2',
            'actual_cost_rate' => 'decimal:2',
            'customer_rate' => 'decimal:2',
            'is_external' => 'boolean',
            'is_scheduled' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(ProjectRole::class, 'project_worker_role', 'project_worker_id', 'project_role_id')
            ->withTimestamps();
    }

    public function quoteItem(): BelongsTo
    {
        return $this->belongsTo(QuoteItem::class, 'quote_item_id');
    }

    public function schedules(): Builder
    {
        return ProjectWorkerSchedule::query()
            ->where('project_id', $this->project_id)
            ->where('worker_id', $this->worker_id);
    }

    public function laborLogs(): HasMany
    {
        return $this->hasMany(ProjectLaborLog::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(ProjectService::class, 'project_service_workers')
            ->withPivot(['assigned_hours', 'notes'])
            ->withTimestamps();
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('assigned_from', '<=', now())
            ->where(function ($q) {
                $q->whereNull('assigned_to')
                    ->orWhere('assigned_to', '>=', now());
            });
    }

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeForWorker($query, int $workerId)
    {
        return $query->where('worker_id', $workerId);
    }

    public function scopeCurrentlyActive($query)
    {
        $now = now();

        return $query->where('status', ProjectWorkerStatus::Active->value)
            ->where('assigned_from', '<=', $now)
            ->where(function ($q) use ($now) {
                $q->whereNull('assigned_to')
                    ->orWhere('assigned_to', '>=', $now);
            });
    }

    public function scopePending($query)
    {
        return $query->where('status', ProjectWorkerStatus::Pending->value);
    }

    public function scopeAccepted($query)
    {
        return $query->where('status', ProjectWorkerStatus::Accepted->value);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', ProjectWorkerStatus::Rejected->value);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', ProjectWorkerStatus::Completed->value);
    }

    public function scopeByStatus($query, ProjectWorkerStatus $status)
    {
        return $query->where('status', $status->value);
    }

    public function scopeSlots($query)
    {
        return $query->where('status', ProjectWorkerStatus::Slot->value);
    }

    public function scopeAssigned($query)
    {
        return $query->whereNotNull('worker_id')
            ->where('status', '!=', ProjectWorkerStatus::Slot->value);
    }

    // ==================== ACCESSORS ====================

    public function getIsCurrentlyActiveAttribute(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        if ($this->assigned_from->isFuture()) {
            return false;
        }

        if ($this->assigned_to && $this->assigned_to->isPast()) {
            return false;
        }

        return true;
    }

    public function getDurationDaysAttribute(): ?int
    {
        if (! $this->assigned_to) {
            return null;
        }

        return $this->assigned_from->diffInDays($this->assigned_to);
    }
}
