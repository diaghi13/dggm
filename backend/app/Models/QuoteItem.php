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
        'product_id',
        'price_list_item_id',
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
        'vat_rate',
        'vat_amount',
        'total_with_vat',
        'include_image',
        'included_media_ids',
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
            'vat_rate' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'total_with_vat' => 'decimal:2',
            'include_image' => 'boolean',
            'included_media_ids' => 'array',
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

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function priceListItem(): BelongsTo
    {
        return $this->belongsTo(PriceListItem::class);
    }

    // Methods
    public function calculateTotal(): void
    {
        if ($this->type === QuoteItemType::Section) {
            // Sections don't have prices
            $this->subtotal = 0;
            $this->discount_amount = 0;
            $this->total = 0;
            $this->vat_amount = 0;
            $this->total_with_vat = 0;
        } else {
            // IVA (usa vat_rate riga o default da Setting)
            $vatRate = $this->vat_rate ?? (float) Setting::get('pricing.default_vat_rate', 22);

            // Se i prezzi sono IVA inclusa, scorporo per ottenere il prezzo netto
            $unitPrice = ($this->unit_price ?? 0);
            if ($this->quote && $this->quote->vat_included_in_prices && $vatRate > 0) {
                $unitPrice = $unitPrice / (1 + $vatRate / 100);
            }

            // Subtotale
            $this->subtotal = ($this->quantity ?? 0) * $unitPrice;

            // Sconto riga
            $this->discount_amount = ($this->subtotal * ($this->discount_percentage ?? 0)) / 100;
            $this->total = $this->subtotal - $this->discount_amount;

            // Applica sconto documento sul totale imponibile prima di IVA
            $imponibile = $this->total;
            if ($this->quote && $this->quote->discount_percentage > 0) {
                $imponibile = $imponibile * (1 - ($this->quote->discount_percentage / 100));
            }

            $this->vat_amount = ($imponibile * $vatRate) / 100;
            $this->total_with_vat = $imponibile + $this->vat_amount;
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
