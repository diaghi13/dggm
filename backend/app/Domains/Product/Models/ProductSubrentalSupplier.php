<?php

namespace App\Domains\Product\Models;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSubrentalSupplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'supplier_id',
        'day_rate',
        'reliability_score',
        'is_preferred',
        'last_updated',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'day_rate' => 'decimal:2',
            'reliability_score' => 'decimal:1',
            'is_preferred' => 'boolean',
            'last_updated' => 'date',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
