<?php

namespace App\Models;

use App\Data\DiscountFamilyData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\LaravelData\WithData;

class DiscountFamily extends Model
{
    use HasFactory, WithData;

    protected string $dataClass = DiscountFamilyData::class;

    protected $fillable = [
        'supplier_id',
        'code',
        'name',
        'description',
        'discount_1',
        'discount_2',
        'discount_3',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_1' => 'decimal:2',
            'discount_2' => 'decimal:2',
            'discount_3' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBySupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    /**
     * Calculate final price after applying cascade discounts
     */
    public function applyDiscounts(float $price): float
    {
        $finalPrice = $price;

        // Apply discount 1
        if ($this->discount_1 > 0) {
            $finalPrice = $finalPrice * (1 - ($this->discount_1 / 100));
        }

        // Apply discount 2 (on already discounted price)
        if ($this->discount_2 > 0) {
            $finalPrice = $finalPrice * (1 - ($this->discount_2 / 100));
        }

        // Apply discount 3 (on already discounted price)
        if ($this->discount_3 > 0) {
            $finalPrice = $finalPrice * (1 - ($this->discount_3 / 100));
        }

        return round($finalPrice, 2);
    }

    /**
     * Get total discount percentage (for display)
     */
    public function getTotalDiscountPercentage(): float
    {
        $multiplier = 1;

        if ($this->discount_1 > 0) {
            $multiplier *= (1 - ($this->discount_1 / 100));
        }
        if ($this->discount_2 > 0) {
            $multiplier *= (1 - ($this->discount_2 / 100));
        }
        if ($this->discount_3 > 0) {
            $multiplier *= (1 - ($this->discount_3 / 100));
        }

        return round((1 - $multiplier) * 100, 2);
    }
}
