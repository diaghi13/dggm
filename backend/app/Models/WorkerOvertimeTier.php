<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerOvertimeTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'worker_rate_id',
        'hours_from',
        'hours_to',
        'multiplier',
        'direct_rate',
        'label',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'hours_from' => 'decimal:2',
            'hours_to' => 'decimal:2',
            'multiplier' => 'decimal:2',
            'direct_rate' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function workerRate(): BelongsTo
    {
        return $this->belongsTo(WorkerRate::class);
    }

    // ==================== METHODS ====================

    /**
     * Check if this tier applies to the given number of hours.
     */
    public function appliesToHours(float $hours): bool
    {
        return $hours >= (float) $this->hours_from
            && ($this->hours_to === null || $hours < (float) $this->hours_to);
    }
}
