<?php

namespace App\Models;

use App\Enums\ProjectScheduleDayStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectWorkerSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'worker_id',
        'scheduled_date',
        'planned_start_time',
        'planned_end_time',
        'planned_hours',
        'status',
        'accepted_at',
        'rejected_at',
        'rejection_reason',
        'notes',
        'cost_rate',
        'customer_rate',
    ];

    protected function casts(): array
    {
        return [
            'project_id' => 'integer',
            'worker_id' => 'integer',
            'scheduled_date' => 'date',
            'planned_hours' => 'decimal:2',
            'cost_rate' => 'decimal:2',
            'customer_rate' => 'decimal:2',
            'status' => ProjectScheduleDayStatus::class,
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
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

    public function laborLogs(): HasMany
    {
        return $this->hasMany(ProjectLaborLog::class, 'schedule_day_id');
    }

    // ==================== ACCESSORS ====================

    public function getEffectivePlannedHoursAttribute(): float
    {
        if ($this->planned_hours !== null) {
            return (float) $this->planned_hours;
        }

        if ($this->planned_start_time && $this->planned_end_time) {
            $start = \Carbon\Carbon::parse($this->planned_start_time);
            $end = \Carbon\Carbon::parse($this->planned_end_time);

            return $start->diffInMinutes($end) / 60;
        }

        return (float) \App\Models\Setting::get('project.hours_per_day', 8);
    }

    // ==================== SCOPES ====================

    public function scopePending($query)
    {
        return $query->where('status', ProjectScheduleDayStatus::Pending->value);
    }

    public function scopeAccepted($query)
    {
        return $query->where('status', ProjectScheduleDayStatus::Accepted->value);
    }

    public function scopeForDate($query, string $date)
    {
        return $query->where('scheduled_date', $date);
    }
}
