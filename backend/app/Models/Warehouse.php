<?php

namespace App\Models;

use App\Enums\WarehouseType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'type',
        'address',
        'city',
        'province',
        'postal_code',
        'manager_id',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => WarehouseType::class,
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function outgoingTransfers(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'from_warehouse_id');
    }

    public function incomingTransfers(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'to_warehouse_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // Accessors
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->postal_code,
            $this->city,
            $this->province ? "({$this->province})" : null,
        ]);

        return implode(', ', $parts);
    }

    public function getTotalValueAttribute(): float
    {
        return (float) $this->inventory()
            ->join('materials', 'inventory.material_id', '=', 'materials.id')
            ->selectRaw('SUM(inventory.quantity_available * materials.standard_cost) as total')
            ->value('total') ?? 0;
    }

    // Boot
    protected static function booted(): void
    {
        static::creating(function ($warehouse) {
            if (empty($warehouse->code)) {
                $count = Warehouse::count() + 1;
                $warehouse->code = 'WH-'.str_pad($count, 3, '0', STR_PAD_LEFT);
            }
        });
    }
}
