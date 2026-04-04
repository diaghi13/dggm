<?php

namespace App\Models;

use App\Data\PriceListItemData;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\LaravelData\WithData;

/**
 * Price List Item Model
 *
 * Individual product pricing within a price list.
 *
 * IMPORTANT: All prices are NET (VAT excluded)
 *
 * Pricing strategy (SINGLE FIELD):
 * - sale_price: Final sale price (either calculated or manual)
 * - is_manual_price: TRUE = manual override, FALSE = auto-calculated
 *
 * When is_manual_price = FALSE:
 * - sale_price is calculated from product.purchase_price + price_list.adjustment
 *
 * When is_manual_price = TRUE:
 * - sale_price is set manually by user and never recalculated
 */
class PriceListItem extends Model
{
    use HasFactory, WithData;

    protected string $dataClass = PriceListItemData::class;

    protected $fillable = [
        'price_list_id',
        'product_id',
        'item_type',
        'name',
        'code',
        'unit',
        'vat_rate',
        'sale_price',
        'is_manual_price',
        'rental_daily',
        'rental_hourly',
        'rental_half_day',
        'rental_weekly',
        'rental_monthly',
        'rental_seasonal',
        'is_manual_rental',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'sale_price' => 'decimal:2',
            'is_manual_price' => 'boolean',
            'rental_daily' => 'decimal:2',
            'rental_hourly' => 'decimal:2',
            'rental_half_day' => 'decimal:2',
            'rental_weekly' => 'decimal:2',
            'rental_monthly' => 'decimal:2',
            'rental_seasonal' => 'decimal:2',
            'is_manual_rental' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Parent price list
     */
    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    /**
     * Product being priced
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ==================== ACCESSORS ====================

    /**
     * Get final sale price (for use in quotes)
     *
     * Always returns the sale_price field (NET, VAT excluded)
     */
    protected function finalSalePrice(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->sale_price
        );
    }

    /**
     * Get final rental daily price (NET, VAT excluded)
     */
    protected function finalRentalDaily(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rental_daily
        );
    }

    /**
     * Get final rental hourly price (NET, VAT excluded)
     */
    protected function finalRentalHourly(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rental_hourly
        );
    }

    /**
     * Get final rental half-day price (NET, VAT excluded)
     */
    protected function finalRentalHalfDay(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rental_half_day
        );
    }

    /**
     * Get final rental weekly price (NET, VAT excluded)
     */
    protected function finalRentalWeekly(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rental_weekly
        );
    }

    /**
     * Get final rental monthly price (NET, VAT excluded)
     */
    protected function finalRentalMonthly(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rental_monthly
        );
    }

    /**
     * Get final rental seasonal price (NET, VAT excluded)
     */
    protected function finalRentalSeasonal(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rental_seasonal
        );
    }

    // ==================== SCOPES ====================

    /**
     * Scope to only active items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to manually priced items
     */
    public function scopeManual($query)
    {
        return $query->where('is_manual_price', true);
    }

    /**
     * Scope to automatically calculated items
     */
    public function scopeAutomatic($query)
    {
        return $query->where('is_manual_price', false);
    }
}
