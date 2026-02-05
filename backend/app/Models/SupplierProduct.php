<?php

namespace App\Models;

use App\Data\SupplierProductData;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\LaravelData\WithData;

class SupplierProduct extends Model
{
    use WithData;

    protected string $dataClass = SupplierProductData::class;

    protected $table = 'supplier_product';

    protected $fillable = [
        'supplier_id',
        'product_id',
        'supplier_product_code',
        'supplier_ean',
        'purchase_price',
        'wholesale_price',
        'retail_price',
        'discount_family_id',
        'manual_discount_1',
        'manual_discount_2',
        'manual_discount_3',
        'package_quantity',
        'minimum_order_quantity',
        'maximum_order_quantity',
        'multiple_order_quantity',
        'lead_time_days',
        'payment_term_id',
        'price_multiplier',
        'currency',
        'last_price_update',
        'is_preferred_supplier',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'wholesale_price' => 'decimal:2',
            'retail_price' => 'decimal:2',
            'manual_discount_1' => 'decimal:2',
            'manual_discount_2' => 'decimal:2',
            'manual_discount_3' => 'decimal:2',
            'price_multiplier' => 'decimal:2',
            'package_quantity' => 'integer',
            'minimum_order_quantity' => 'integer',
            'maximum_order_quantity' => 'integer',
            'multiple_order_quantity' => 'integer',
            'lead_time_days' => 'integer',
            'last_price_update' => 'date',
            'is_preferred_supplier' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * @return BelongsTo<Supplier, SupplierProduct>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<Product, SupplierProduct>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<DiscountFamily, SupplierProduct>
     */
    public function discountFamily(): BelongsTo
    {
        return $this->belongsTo(DiscountFamily::class);
    }

    /**
     * @return BelongsTo<PaymentTerm, SupplierProduct>
     */
    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    // ==================== ACCESSORS ====================

    /**
     * Calculate final price after applying cascade discounts
     */
    public function getFinalPriceAttribute(): float
    {
        $price = $this->purchase_price;

        // Apply manual discounts if set, otherwise use discount family
        $discounts = [
            $this->manual_discount_1 ?? $this->discountFamily?->discount_1 ?? 0,
            $this->manual_discount_2 ?? $this->discountFamily?->discount_2 ?? 0,
            $this->manual_discount_3 ?? $this->discountFamily?->discount_3 ?? 0,
        ];

        // Apply cascade discounts
        foreach ($discounts as $discount) {
            if ($discount > 0) {
                $price = $price * (1 - ($discount / 100));
            }
        }

        // Apply multiplier
        $price = $price * $this->price_multiplier;

        return round($price, 2);
    }

    /**
     * Get effective discounts (manual or from family)
     */
    public function getEffectiveDiscountsAttribute(): array
    {
        return [
            'discount_1' => $this->manual_discount_1 ?? $this->discountFamily?->discount_1 ?? 0,
            'discount_2' => $this->manual_discount_2 ?? $this->discountFamily?->discount_2 ?? 0,
            'discount_3' => $this->manual_discount_3 ?? $this->discountFamily?->discount_3 ?? 0,
        ];
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePreferred($query)
    {
        return $query->where('is_preferred_supplier', true);
    }

    public function scopeForSupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeForProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }
}
