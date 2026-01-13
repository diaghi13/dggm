<?php

namespace App\Models;

use App\Enums\SiteMaterialStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SiteMaterial extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'site_id',
        'material_id',
        'quote_item_id',
        'is_extra',
        'requested_by',
        'requested_at',
        'extra_reason',
        'planned_quantity',
        'allocated_quantity',
        'delivered_quantity',
        'used_quantity',
        'returned_quantity',
        'planned_unit_cost',
        'actual_unit_cost',
        'status',
        'required_date',
        'delivery_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => SiteMaterialStatus::class,
            'is_extra' => 'boolean',
            'requested_at' => 'datetime',
            'planned_quantity' => 'decimal:2',
            'allocated_quantity' => 'decimal:2',
            'delivered_quantity' => 'decimal:2',
            'used_quantity' => 'decimal:2',
            'returned_quantity' => 'decimal:2',
            'planned_unit_cost' => 'decimal:2',
            'actual_unit_cost' => 'decimal:2',
            'required_date' => 'date',
            'delivery_date' => 'date',
        ];
    }

    // Relationships
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function quoteItem(): BelongsTo
    {
        return $this->belongsTo(QuoteItem::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    // Scopes
    public function scopeByStatus($query, SiteMaterialStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForSite($query, int $siteId)
    {
        return $query->where('site_id', $siteId);
    }

    public function scopePlanned($query)
    {
        return $query->where('status', SiteMaterialStatus::PLANNED);
    }

    public function scopeReserved($query)
    {
        return $query->where('status', SiteMaterialStatus::RESERVED);
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', SiteMaterialStatus::DELIVERED);
    }

    public function scopeInUse($query)
    {
        return $query->where('status', SiteMaterialStatus::IN_USE);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', SiteMaterialStatus::COMPLETED);
    }

    public function scopeNeedingDelivery($query)
    {
        return $query->whereIn('status', [
            SiteMaterialStatus::PLANNED,
            SiteMaterialStatus::RESERVED,
        ])->where('delivered_quantity', '<', 'planned_quantity');
    }

    public function scopeExtras($query)
    {
        return $query->where('is_extra', true);
    }

    public function scopeFromQuote($query)
    {
        return $query->where('is_extra', false)->whereNotNull('quote_item_id');
    }

    // Accessors
    public function getRemainingQuantityAttribute(): float
    {
        return max(0, $this->planned_quantity - $this->used_quantity);
    }

    public function getUsagePercentageAttribute(): float
    {
        if ($this->planned_quantity == 0) {
            return 0;
        }

        return ($this->used_quantity / $this->planned_quantity) * 100;
    }

    public function getPlannedTotalCostAttribute(): float
    {
        return $this->planned_quantity * $this->planned_unit_cost;
    }

    public function getActualTotalCostAttribute(): float
    {
        return $this->used_quantity * $this->actual_unit_cost;
    }

    public function getCostVarianceAttribute(): float
    {
        return $this->planned_total_cost - $this->actual_total_cost;
    }

    public function getCostVariancePercentageAttribute(): float
    {
        if ($this->planned_total_cost == 0) {
            return 0;
        }

        return ($this->cost_variance / $this->planned_total_cost) * 100;
    }

    public function getQuantityVarianceAttribute(): float
    {
        return $this->planned_quantity - $this->used_quantity;
    }

    public function isOverBudgetAttribute(): bool
    {
        return $this->actual_total_cost > $this->planned_total_cost;
    }

    public function isCompleteAttribute(): bool
    {
        return $this->used_quantity >= $this->planned_quantity;
    }
}
