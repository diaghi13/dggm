<?php

namespace App\Domains\Project\Models;

use App\Enums\OvertimeCause;
use App\Enums\ProjectLogStatus;
use App\Models\User;
use App\Models\Worker;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectLaborLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'project_worker_id',
        'worker_id',
        'schedule_day_id',
        'log_date',
        'clock_in',
        'clock_out',
        'regular_hours',
        'overtime_hours',
        'description',
        'submitted_by_user_id',
        'status',
        'approved_by_user_id',
        'approved_at',
        'rejection_reason',
        'labor_cost_id',
        'overtime_cause',
        'is_billable_to_client',
        'overtime_rate_multiplier',
        'include_in_final_balance',
        'break_minutes',
        'overtime_rate_type',
        'overtime_direct_rate',
        'is_auto_approved',
    ];

    protected function casts(): array
    {
        return [
            'log_date' => 'date',
            'clock_in' => 'string',
            'clock_out' => 'string',
            'regular_hours' => 'decimal:2',
            'overtime_hours' => 'decimal:2',
            'status' => ProjectLogStatus::class,
            'approved_at' => 'datetime',
            'overtime_cause' => OvertimeCause::class,
            'is_billable_to_client' => 'boolean',
            'overtime_rate_multiplier' => 'decimal:2',
            'include_in_final_balance' => 'boolean',
            'break_minutes' => 'integer',
            'overtime_rate_type' => 'string',
            'overtime_direct_rate' => 'decimal:2',
            'is_auto_approved' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function projectWorker(): BelongsTo
    {
        return $this->belongsTo(ProjectWorker::class);
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    public function scheduleDay(): BelongsTo
    {
        return $this->belongsTo(ProjectWorkerSchedule::class, 'schedule_day_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function laborCost(): BelongsTo
    {
        return $this->belongsTo(ProjectLaborCost::class, 'labor_cost_id');
    }

    // ==================== ACCESSORS ====================

    public function getTotalHoursAttribute(): float
    {
        if ($this->clock_in && $this->clock_out && (float) $this->regular_hours == 0 && (float) $this->overtime_hours == 0) {
            $start = \Carbon\Carbon::parse($this->clock_in);
            $end = \Carbon\Carbon::parse($this->clock_out);
            if ($end->lt($start)) {
                $end->addDay();
            }
            $totalMinutes = $start->diffInMinutes($end) - (int) ($this->break_minutes ?? 0);

            return round(max(0, $totalMinutes) / 60, 2);
        }

        return round((float) $this->regular_hours + (float) $this->overtime_hours, 2);
    }

    public function getOvertimeCostAttribute(): float
    {
        if (! $this->overtime_hours || (float) $this->overtime_hours <= 0) {
            return 0.0;
        }

        // Try to get the base rate from the related ProjectLaborCost
        $baseRate = 0.0;
        if ($this->relationLoaded('laborCost') && $this->laborCost) {
            $baseRate = (float) ($this->laborCost->unit_rate ?? 0);
        }

        if ($baseRate <= 0) {
            return 0.0;
        }

        return (float) $this->overtime_hours * (float) ($this->overtime_rate_multiplier ?? 1.00) * $baseRate;
    }

    // ==================== SCOPES ====================

    public function scopeSubmitted($query)
    {
        return $query->where('status', ProjectLogStatus::Submitted->value);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', ProjectLogStatus::Approved->value);
    }

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeForWorker($query, int $workerId)
    {
        return $query->where('worker_id', $workerId);
    }
}
