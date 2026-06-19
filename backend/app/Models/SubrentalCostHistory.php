<?php

namespace App\Models;

use App\Domains\Product\Models\Product;
use App\Domains\Quote\Models\Quote;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubrentalCostHistory extends Model
{
    use HasFactory;

    protected $table = 'subrental_cost_history';

    protected $fillable = [
        'product_id',
        'supplier_id',
        'quote_id',
        'actual_cost',
        'duration_days',
        'margin_generated',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'actual_cost' => 'decimal:2',
            'duration_days' => 'decimal:2',
            'margin_generated' => 'decimal:2',
            'date' => 'date',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }
}
