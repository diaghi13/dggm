<?php

namespace App\Models;

use App\Enums\KitAssemblyStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KitAssembly extends Model
{
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'name',
        'status',
        'location',
        'notes',
        'assembled_at',
        'disassembled_at',
        'assembled_by_user_id',
        'disassembled_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => KitAssemblyStatus::class,
            'assembled_at' => 'datetime',
            'disassembled_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(KitAssemblyItem::class);
    }

    public function assembledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assembled_by_user_id');
    }

    public function disassembledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disassembled_by_user_id');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            KitAssemblyStatus::Assembled->value,
            KitAssemblyStatus::InUse->value,
            KitAssemblyStatus::Returned->value,
        ]);
    }

    public function scopeForProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }
}
