<?php

namespace App\Domains\Warehouse\Models;

use App\Domains\Product\Models\Product;
use App\Enums\InventoryReservationStatus;
use App\Enums\InventoryReservationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryReservation extends Model
{
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'quantity',
        'start_date',
        'end_date',
        'type',
        'reference_type',
        'reference_id',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'type' => InventoryReservationType::class,
            'status' => InventoryReservationStatus::class,
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

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    // Scopes

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [
            InventoryReservationStatus::Confirmed->value,
            InventoryReservationStatus::Active->value,
        ]);
    }

    public function scopeForProduct(Builder $query, int $productId): Builder
    {
        return $query->where('product_id', $productId);
    }

    public function scopeOverlappingDates(Builder $query, string $startDate, ?string $endDate): Builder
    {
        return $query->where('start_date', '<=', $endDate ?? '9999-12-31')
            ->where(fn (Builder $q) => $q
                ->whereNull('end_date')
                ->orWhere('end_date', '>=', $startDate)
            );
    }
}
