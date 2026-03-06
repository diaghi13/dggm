<?php

namespace App\Models;

use App\Data\PriceListData;
use App\Enums\PriceListAdjustmentType;
use App\Enums\PriceListAppliesTo;
use App\Enums\PriceListCalculationMode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\LaravelData\WithData;

/**
 * Price List Model
 *
 * Manages product pricing configurations with automatic calculation
 * from base costs or manual override per item.
 *
 * IMPORTANT: All prices are NET (VAT excluded)
 *
 * Calculation modes:
 * - base_cost: Calculate from product.purchase_price + markup
 * - manual: Use PriceListItem.sale_price directly
 */
class PriceList extends Model
{
    use HasFactory, SoftDeletes, WithData;

    protected string $dataClass = PriceListData::class;

    protected $fillable = [
        'name',
        'code',
        'description',
        'calculation_mode',
        'adjustment_type',
        'adjustment_value',
        'applies_to',
        'category_id',
        'rental_profile_id',
        'department_filter',
        'valid_from',
        'valid_to',
        'is_active',
        'is_default',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'calculation_mode' => PriceListCalculationMode::class,
            'adjustment_type' => PriceListAdjustmentType::class,
            'applies_to' => PriceListAppliesTo::class,
            'adjustment_value' => 'decimal:2',
            'valid_from' => 'date',
            'valid_to' => 'date',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Category filter (if price list applies only to specific category)
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }

    /**
     * Optional rental profile (sector preset for Power-Decay curve parameters)
     */
    public function rentalProfile(): BelongsTo
    {
        return $this->belongsTo(RentalProfile::class);
    }

    /**
     * All price list items
     */
    public function items(): HasMany
    {
        return $this->hasMany(PriceListItem::class);
    }

    /**
     * Only active price list items
     */
    public function activeItems(): HasMany
    {
        return $this->items()->where('is_active', true);
    }

    // ==================== SCOPES ====================

    /**
     * Scope to only active price lists
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to default price list
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope to price lists valid at a specific date
     *
     * @param  \DateTime|null  $date  Date to check (defaults to now)
     */
    public function scopeValid($query, ?\DateTime $date = null)
    {
        $date = $date ?? now();

        return $query->where(function ($q) use ($date) {
            $q->whereNull('valid_from')
                ->orWhere('valid_from', '<=', $date);
        })->where(function ($q) use ($date) {
            $q->whereNull('valid_to')
                ->orWhere('valid_to', '>=', $date);
        });
    }

    /**
     * Scope to price lists applicable to a specific product
     *
     * Checks if price list applies to product's category or all products
     */
    public function scopeForProduct($query, Product $product)
    {
        return $query->where(function ($q) use ($product) {
            $q->whereNull('category_id')
                ->orWhere('category_id', $product->category_id);
        });
    }

    // ==================== BOOT ====================

    /**
     * Boot model events
     */
    protected static function booted(): void
    {
        // Ensure only one default price list
        static::saving(function ($priceList) {
            if ($priceList->is_default) {
                static::where('id', '!=', $priceList->id)
                    ->update(['is_default' => false]);
            }
        });
    }
}
