<?php

namespace App\Models;

use App\Enums\ProjectLogStatus;
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
        'regular_hours',
        'overtime_hours',
        'description',
        'submitted_by_user_id',
        'status',
        'approved_by_user_id',
        'approved_at',
        'rejection_reason',
        'labor_cost_id',
    ];

    protected function casts(): array
    {
        return [
            'log_date' => 'date',
            'regular_hours' => 'decimal:2',
            'overtime_hours' => 'decimal:2',
            'status' => ProjectLogStatus::class,
            'approved_at' => 'datetime',
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
        return (float) $this->regular_hours + (float) $this->overtime_hours;
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
