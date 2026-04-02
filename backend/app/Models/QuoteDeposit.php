<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteDeposit extends Model
{
    protected $fillable = [
        'quote_id',
        'sort_order',
        'description',
        'percentage',
        'amount',
        'is_fixed_amount',
        'due_date',
        'due_event',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'decimal:2',
            'amount' => 'decimal:2',
            'is_fixed_amount' => 'boolean',
            'due_date' => 'date:Y-m-d',
        ];
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }
}
