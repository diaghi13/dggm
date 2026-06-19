<?php

namespace App\Domains\Product\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductEmbedding extends Model
{
    use HasFactory;

    protected $table = 'product_embeddings';

    protected $fillable = [
        'product_id',
        'model',
        'embedding',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'embedding' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
