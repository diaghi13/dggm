<?php

namespace App\Models;

use App\Domains\Product\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KitAssemblyItem extends Model
{
    protected $fillable = [
        'kit_assembly_id',
        'product_id',
        'quantity',
        'serial_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    public function kitAssembly(): BelongsTo
    {
        return $this->belongsTo(KitAssembly::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
