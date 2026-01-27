<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DdtItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'ddt_id',
        'product_id',
        'quantity',
        'unit',
        'unit_cost',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_cost' => 'decimal:2',
        ];
    }

    // Relationships
    public function ddt(): BelongsTo
    {
        return $this->belongsTo(Ddt::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Accessors
    public function getTotalCostAttribute(): float
    {
        return $this->quantity * ($this->unit_cost ?? 0);
    }
}
