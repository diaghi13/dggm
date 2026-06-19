<?php

namespace App\Domains\Quote\Models;

use App\Domains\Product\Models\Product;
use App\Domains\Project\Models\ProjectWorker;
use App\Enums\QuoteItemBillingUnit;
use App\Enums\QuoteItemType;
use App\Models\PriceListItem;
use App\Models\Setting;
use App\Services\RentalEngineService;
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
        'billing_unit',
        'duration',
        'quantity',
        'unit_price',
        'cost_price',
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
        'expand_kit',
    ];

    protected function casts(): array
    {
        return [
            'type' => QuoteItemType::class,
            'billing_unit' => QuoteItemBillingUnit::class,
            'duration' => 'decimal:2',
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'hide_unit_price' => 'boolean',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'vat_rate' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'total_with_vat' => 'decimal:2',
            'include_image' => 'boolean',
            'expand_kit' => 'boolean',
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

    public function projectWorkerSlots(): HasMany
    {
        return $this->hasMany(ProjectWorker::class, 'quote_item_id');
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

            // Subtotale — tiene conto di billing_unit e duration
            $billingUnit = $this->billing_unit ?? QuoteItemBillingUnit::Unit;
            $qty = (float) ($this->quantity ?? 0);

            // Duration: usa valore riga se impostato, altrimenti eredita da quote.event_days
            $duration = $this->duration !== null
                ? (float) $this->duration
                : (float) ($this->quote?->effective_event_days ?? 1);

            $this->subtotal = match ($billingUnit) {
                QuoteItemBillingUnit::Flat => $unitPrice,
                QuoteItemBillingUnit::Unit => $qty * $unitPrice,
                QuoteItemBillingUnit::Day => $qty * $unitPrice * $this->calculateDurationMultiplier($duration),
                default => $qty * $unitPrice * $duration, // hour, week, month — lineare
            };

            // Sconto riga
            $this->discount_amount = ($this->subtotal * ($this->discount_percentage ?? 0)) / 100;
            $this->total = $this->subtotal - $this->discount_amount;

            // IVA calcolata sul totale riga (lo sconto documento viene applicato a livello preventivo)
            $this->vat_amount = ($this->total * $vatRate) / 100;
            $this->total_with_vat = $this->total + $this->vat_amount;
        }
    }

    /**
     * Moltiplicatore durata delegato a RentalEngineService (Power-Decay Curve).
     * 7gg≈3.39×, 30gg≈7.78×, 90gg≈14.49× — configurabile via settings rental.*
     */
    private function calculateDurationMultiplier(float $days): float
    {
        return app(RentalEngineService::class)->calculateDurationMultiplier($days);
    }

    public function getMarginAmountAttribute(): ?float
    {
        if ($this->cost_price === null || $this->unit_price === null) {
            return null;
        }

        return (float) $this->unit_price - (float) $this->cost_price;
    }

    public function getMarginPercentAttribute(): ?float
    {
        if ($this->cost_price === null || $this->unit_price === null || (float) $this->unit_price == 0) {
            return null;
        }

        return ((float) $this->unit_price - (float) $this->cost_price) / (float) $this->unit_price * 100;
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
