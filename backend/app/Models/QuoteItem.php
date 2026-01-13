<?php

namespace App\Models;

use App\Enums\QuoteItemType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuoteItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_id',
        'parent_id',
        'material_id',
        'type',
        'code',
        'description',
        'notes',
        'sort_order',
        'unit',
        'quantity',
        'unit_price',
        'discount_percentage',
        'hide_unit_price',
        'subtotal',
        'discount_amount',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'type' => QuoteItemType::class,
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'hide_unit_price' => 'boolean',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    // Relationships
    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(QuoteItem::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(QuoteItem::class, 'parent_id')->orderBy('sort_order');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    // Methods
    public function calculateTotal(): void
    {
        if ($this->type === QuoteItemType::Section) {
            // Sections don't have prices
            $this->subtotal = 0;
            $this->discount_amount = 0;
            $this->total = 0;
        } else {
            $this->subtotal = ($this->quantity ?? 0) * ($this->unit_price ?? 0);
            $this->discount_amount = ($this->subtotal * ($this->discount_percentage ?? 0)) / 100;
            $this->total = $this->subtotal - $this->discount_amount;
        }
    }

    public function isSection(): bool
    {
        return $this->type === QuoteItemType::Section;
    }

    // Boot
    protected static function booted(): void
    {
        static::creating(function ($item) {
            $item->discount_percentage = $item->discount_percentage ?? 0;
            $item->calculateTotal();
        });

        static::updating(function ($item) {
            $item->calculateTotal();
        });

        static::saved(function ($item) {
            if ($item->quote) {
                $item->quote->calculateTotals();
            }
        });

        static::deleted(function ($item) {
            if ($item->quote) {
                $item->quote->calculateTotals();
            }
        });
    }
}
