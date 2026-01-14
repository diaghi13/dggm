<?php

namespace App\Models;

use App\Enums\RateContext;
use App\Enums\RateType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'worker_id',
        'rate_type',
        'context',
        'rate_amount',
        'currency',
        'project_type',
        'overtime_multiplier',
        'holiday_multiplier',
        'overtime_starts_after_hours',
        'overtime_starts_after_time',
        'recognizes_overtime',
        'is_forfait',
        'valid_from',
        'valid_to',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'rate_type' => RateType::class,
            'context' => RateContext::class,
            'rate_amount' => 'decimal:2',
            'overtime_multiplier' => 'decimal:2',
            'holiday_multiplier' => 'decimal:2',
            'overtime_starts_after_hours' => 'decimal:2',
            'recognizes_overtime' => 'boolean',
            'is_forfait' => 'boolean',
            'valid_from' => 'date',
            'valid_to' => 'date',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    // ==================== SCOPES ====================

    public function scopeCurrent($query)
    {
        $now = now();

        return $query->where('valid_from', '<=', $now)
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', $now);
            });
    }

    public function scopeForContext($query, RateContext $context)
    {
        return $query->where('context', $context);
    }

    public function scopeForRateType($query, RateType $rateType)
    {
        return $query->where('rate_type', $rateType);
    }

    public function scopeValidOn($query, \DateTime $date)
    {
        return $query->where('valid_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', $date);
            });
    }

    // ==================== ACCESSORS ====================

    public function getIsCurrentAttribute(): bool
    {
        $now = now();

        if ($this->valid_from->isFuture()) {
            return false;
        }

        if ($this->valid_to && $this->valid_to->isPast()) {
            return false;
        }

        return true;
    }

    // ==================== METHODS ====================

    /**
     * Calculate amount for given hours/units with multipliers
     */
    public function calculateAmount(
        float $hours,
        bool $isOvertime = false,
        bool $isHoliday = false
    ): float {
        $baseAmount = $this->rate_amount * $hours;

        if ($isHoliday) {
            return $baseAmount * $this->holiday_multiplier;
        }

        if ($isOvertime) {
            return $baseAmount * $this->overtime_multiplier;
        }

        return $baseAmount;
    }

    /**
     * Check if this rate overlaps with another rate
     */
    public function overlaps(WorkerRate $otherRate): bool
    {
        // Different context or rate type = no overlap
        if ($this->context !== $otherRate->context || $this->rate_type !== $otherRate->rate_type) {
            return false;
        }

        // Check date overlap
        $thisStart = $this->valid_from;
        $thisEnd = $this->valid_to ?? now()->addYears(100);
        $otherStart = $otherRate->valid_from;
        $otherEnd = $otherRate->valid_to ?? now()->addYears(100);

        return $thisStart <= $otherEnd && $otherStart <= $thisEnd;
    }
}
