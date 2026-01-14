<?php

namespace App\Models;

use App\Enums\RateType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractorRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'contractor_id',
        'service_type',
        'rate_type',
        'rate_amount',
        'currency',
        'minimum_hours',
        'minimum_amount',
        'is_forfait',
        'valid_from',
        'valid_to',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'rate_type' => RateType::class,
            'rate_amount' => 'decimal:2',
            'minimum_hours' => 'decimal:2',
            'minimum_amount' => 'decimal:2',
            'is_forfait' => 'boolean',
            'valid_from' => 'date',
            'valid_to' => 'date',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function contractor(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'contractor_id');
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

    public function scopeForServiceType($query, string $serviceType)
    {
        return $query->where('service_type', $serviceType);
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

    public function getHasMinimumChargeAttribute(): bool
    {
        return $this->minimum_hours !== null || $this->minimum_amount !== null;
    }

    // ==================== METHODS ====================

    /**
     * Calculate cost for given hours/units with minimum charge consideration
     */
    public function calculateCost(float $hours): float
    {
        $standardCost = $this->rate_amount * $hours;

        // Apply minimum charge if set
        if ($this->minimum_hours && $hours < $this->minimum_hours) {
            $standardCost = $this->rate_amount * $this->minimum_hours;
        }

        if ($this->minimum_amount && $standardCost < $this->minimum_amount) {
            return $this->minimum_amount;
        }

        return $standardCost;
    }

    /**
     * Get effective hours considering minimum
     */
    public function getEffectiveHours(float $actualHours): float
    {
        if ($this->minimum_hours && $actualHours < $this->minimum_hours) {
            return $this->minimum_hours;
        }

        return $actualHours;
    }
}
