<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'quantity_available',
        'quantity_reserved',
        'quantity_in_transit',
        'quantity_quarantine',
        'minimum_stock',
        'maximum_stock',
        'last_count_date',
    ];

    protected function casts(): array
    {
        return [
            'quantity_available' => 'decimal:2',
            'quantity_reserved' => 'decimal:2',
            'quantity_in_transit' => 'decimal:2',
            'quantity_quarantine' => 'decimal:2',
            'minimum_stock' => 'decimal:2',
            'maximum_stock' => 'decimal:2',
            'last_count_date' => 'date',
        ];
    }

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    // Accessors
    public function getQuantityFreeAttribute(): float
    {
        return max(0, $this->quantity_available - $this->quantity_reserved);
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->quantity_available <= $this->minimum_stock;
    }

    public function getStockValueAttribute(): float
    {
        return $this->quantity_available * ($this->product->standard_cost ?? 0);
    }

    // Business methods
    public function reserve(float $quantity): bool
    {
        if ($this->quantity_free < $quantity) {
            return false; // Not enough stock
        }

        $this->quantity_reserved += $quantity;

        return $this->save();
    }

    public function releaseReservation(float $quantity): bool
    {
        $this->quantity_reserved = max(0, $this->quantity_reserved - $quantity);

        return $this->save();
    }

    public function addStock(float $quantity): bool
    {
        $this->quantity_available += $quantity;

        return $this->save();
    }

    public function removeStock(float $quantity): bool
    {
        if ($this->quantity_available < $quantity) {
            return false;
        }

        $this->quantity_available -= $quantity;

        return $this->save();
    }

    public function moveToQuarantine(float $quantity): bool
    {
        if ($this->quantity_available < $quantity) {
            return false;
        }

        $this->quantity_available -= $quantity;
        $this->quantity_quarantine += $quantity;

        return $this->save();
    }

    public function releaseFromQuarantine(float $quantity): bool
    {
        if ($this->quantity_quarantine < $quantity) {
            return false;
        }

        $this->quantity_quarantine -= $quantity;
        $this->quantity_available += $quantity;

        return $this->save();
    }

    public function removeFromQuarantine(float $quantity): bool
    {
        if ($this->quantity_quarantine < $quantity) {
            return false;
        }

        $this->quantity_quarantine -= $quantity;

        return $this->save();
    }
}
