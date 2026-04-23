<?php

namespace App\Models;

use App\Enums\QuoteItemType;
use App\Enums\QuoteType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Quote extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'code',
        'quote_type',
        'event_days',
        'title',
        'customer_id',
        'project_manager_id',
        'description',
        'address',
        'city',
        'province',
        'postal_code',
        'status',
        'issue_date',
        'expiry_date',
        'valid_until',
        'sent_date',
        'approved_date',
        'subtotal',
        'discount_percentage',
        'discount_amount',
        'tax_percentage',
        'tax_included',
        'show_unit_prices',
        'tax_amount',
        'total_amount',
        'payment_method',
        'payment_terms',
        'template_id',
        'project_id',
        'notes',
        'terms_and_conditions',
        'footer_text',
        // NEW: Price list and payment
        'price_list_id',
        'payment_term_id',
        'financial_resource_id',
        'deposit_percentage',
        'deposit_amount',
        'balance_label',
        // NEW: Work timeline
        'work_start_description',
        'work_start_date',
        'work_duration_description',
        'work_end_date',
        // NEW: Warranty and display options
        'warranty_type_id',
        'show_product_codes',
        'show_vat',
        'show_section_totals',
        'vat_included_in_prices',
        'include_terms_and_conditions',
        'customer_token',
        'customer_token_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'quote_type' => QuoteType::class,
            'event_days' => 'integer',
            'issue_date' => 'date:Y-m-d',
            'expiry_date' => 'date:Y-m-d',
            'valid_until' => 'date:Y-m-d',
            'sent_date' => 'date:Y-m-d',
            'approved_date' => 'date:Y-m-d',
            'work_start_date' => 'date:Y-m-d',
            'work_end_date' => 'date:Y-m-d',
            'subtotal' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_percentage' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'deposit_percentage' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'tax_included' => 'boolean',
            'show_unit_prices' => 'boolean',
            'show_product_codes' => 'boolean',
            'show_vat' => 'boolean',
            'show_section_totals' => 'boolean',
            'vat_included_in_prices' => 'boolean',
            'include_terms_and_conditions' => 'boolean',
            'customer_token_expires_at' => 'datetime',
        ];
    }

    public function isCustomerTokenValid(): bool
    {
        return $this->customer_token !== null
            && ($this->customer_token_expires_at === null || $this->customer_token_expires_at->isFuture());
    }

    /**
     * Giorni fatturabili effettivi: usa event_days se impostato,
     * altrimenti calcola la differenza tra work_start_date e work_end_date.
     */
    public function getEffectiveEventDaysAttribute(): int
    {
        if ($this->event_days !== null) {
            return $this->event_days;
        }

        if ($this->work_start_date && $this->work_end_date) {
            $diff = (int) $this->work_start_date->diffInDays($this->work_end_date);

            return max(1, $diff);
        }

        return 1;
    }

    // Relationships
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function projectManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class)->orderBy('sort_order');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(QuoteTemplate::class, 'template_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    public function financialResource(): BelongsTo
    {
        return $this->belongsTo(FinancialResource::class);
    }

    public function warrantyType(): BelongsTo
    {
        return $this->belongsTo(WarrantyType::class);
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(QuoteDeposit::class)->orderBy('sort_order');
    }

    public function finalBalances(): HasMany
    {
        return $this->hasMany(FinalBalance::class);
    }

    // Scopes
    public function scopeOfStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForCustomer($query, int $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['draft', 'sent']);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'sent')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<', now());
    }

    // Methods
    public function calculateTotals(): void
    {
        // Load parent items with children in one query
        $parentItems = $this->items()->whereNull('parent_id')->with('children')->get();

        foreach ($parentItems as $parentItem) {
            if ($parentItem->children->count() > 0) {
                // If item has children, sum their totals
                $parentItem->subtotal = $parentItem->children->sum('subtotal');
                $parentItem->discount_amount = $parentItem->children->sum('discount_amount');
                $parentItem->total = $parentItem->children->sum('total');
                $parentItem->vat_amount = $parentItem->children->sum('vat_amount');
                $parentItem->total_with_vat = $parentItem->children->sum('total_with_vat');
                $parentItem->saveQuietly();
            }
        }

        // Reuse already-loaded collection (avoid second DB query)
        $items = $parentItems;

        $this->subtotal = $items->sum('subtotal');

        // Use discount_amount as source of truth (set by frontend from user input).
        // Rederive discount_percentage from it to avoid precision loss caused by
        // the percentage round-trip (e.g. 4000 / 78000 → 5.13% → 4001.40).
        if ($this->subtotal > 0 && $this->discount_amount > 0) {
            $this->discount_percentage = round(($this->discount_amount / $this->subtotal) * 100, 4);
        } else {
            // Fallback: derive amount from percentage (e.g. when only % was entered)
            $this->discount_amount = round(($this->subtotal * $this->discount_percentage) / 100, 2);
        }

        $totalImponibile = $this->subtotal - $this->discount_amount;

        // IVA: somma vat_amount delle righe scalata per lo sconto documento
        // (ogni riga calcola IVA sul proprio totale; lo sconto documento riduce proporzionalmente)
        $rawVat = $items->sum('vat_amount');
        $discountFactor = $this->subtotal > 0 ? ($totalImponibile / $this->subtotal) : 1;
        $this->tax_amount = round($rawVat * $discountFactor, 2);
        $this->total_amount = $totalImponibile + $this->tax_amount;

        // Calcola acconto se percentuale presente
        if ($this->deposit_percentage > 0) {
            $this->deposit_amount = ($this->total_amount * $this->deposit_percentage) / 100;
        }

        $this->saveQuietly();

        // Ricalcola amount dei deposit basati su percentuale (l'ultimo assorbe il resto dell'arrotondamento)
        $percentageDeposits = $this->deposits()
            ->where('is_fixed_amount', false)
            ->whereNotNull('percentage')
            ->orderBy('sort_order')
            ->get();

        if ($percentageDeposits->isNotEmpty()) {
            $totalPct = $percentageDeposits->sum('percentage');
            $isFullSchedule = abs($totalPct - 100) < 0.01;
            $runningSum = 0.0;
            $lastIndex = $percentageDeposits->count() - 1;

            foreach ($percentageDeposits as $i => $deposit) {
                if ($isFullSchedule && $i === $lastIndex) {
                    $deposit->amount = round($this->total_amount - $runningSum, 2);
                } else {
                    $deposit->amount = round(($this->total_amount * $deposit->percentage) / 100, 2);
                    $runningSum += $deposit->amount;
                }
                $deposit->saveQuietly();
            }
        }
    }

    public function canBeHardDeleted(): bool
    {
        return $this->status === 'draft'
            && is_null($this->project_id)
            && is_null($this->sent_date)
            && is_null($this->approved_date);
    }

    public function deletionBlockReason(): string
    {
        if (! is_null($this->project_id)) {
            return 'Il preventivo è associato a un progetto e non può essere eliminato.';
        }
        if (! is_null($this->sent_date)) {
            return 'Il preventivo è già stato inviato al cliente e non può essere eliminato.';
        }
        if (! is_null($this->approved_date)) {
            return 'Il preventivo è già stato approvato e non può essere eliminato.';
        }

        return 'Solo i preventivi in bozza possono essere eliminati.';
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'sent']);
    }

    public function canBeApproved(): bool
    {
        return in_array($this->status, ['sent', 'rejected']);
    }

    public function approve(): void
    {
        $this->update([
            'status' => 'approved',
            'approved_date' => now(),
        ]);
    }

    public function reject(): void
    {
        $this->update(['status' => 'rejected']);
    }

    public function send(): void
    {
        $this->update([
            'status' => 'sent',
            'sent_date' => now(),
        ]);
    }

    public function convertToProject(): ?Project
    {
        if ($this->status !== 'approved') {
            return null;
        }

        $project = Project::create([
            'code' => app(\App\Services\CodeGeneratorService::class)->generate('project'),
            'name' => $this->title,
            'customer_id' => $this->customer_id,
            'project_manager_id' => $this->project_manager_id,
            'description' => $this->description,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'start_date' => $this->work_start_date?->format('Y-m-d'),
            'estimated_end_date' => $this->work_end_date?->format('Y-m-d'),
            'quote_id' => $this->id,
            'status' => 'planned',
            'estimated_amount' => $this->total_amount,
            'is_active' => true,
        ]);

        $this->createProjectProducts($project);

        $this->update([
            'project_id' => $project->id,
            'status' => 'converted',
        ]);

        return $project;
    }

    protected function createProjectProducts(Project $project): void
    {
        $productItems = $this->items()
            ->whereIn('type', [QuoteItemType::Item->value])
            ->whereNotNull('product_id')
            ->where('quantity', '>', 0)
            ->get();

        foreach ($productItems as $item) {

            $unitPrice = (float) ($item->unit_price ?? 0);

            // If quote uses VAT-inclusive prices, strip VAT to get the net cost
            if ($this->vat_included_in_prices && $item->vat_rate > 0) {
                $unitPrice = $unitPrice / (1 + ($item->vat_rate / 100));
            }

            ProjectMaterial::create([
                'project_id' => $project->id,
                'product_id' => $item->product_id,
                'quote_item_id' => $item->id,
                'is_extra' => false,
                'planned_quantity' => $item->quantity,
                'allocated_quantity' => 0,
                'delivered_quantity' => 0,
                'used_quantity' => 0,
                'returned_quantity' => 0,
                'planned_unit_cost' => round($unitPrice, 4),
                'actual_unit_cost' => round($unitPrice, 4),
                'status' => 'planned',
                'notes' => $item->notes,
                'is_rental' => in_array($item->billing_unit?->value, ['day', 'hour', 'week', 'month']),
            ]);
        }
    }

    // Media Collections
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('pdfs')->useDisk('public');
        $this->addMediaCollection('attachments')->useDisk('public');
        $this->addMediaCollection('custom_images')->useDisk('public');
    }

    // Attributes
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->postal_code,
            $this->city,
            $this->province ? "({$this->province})" : null,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Check if quote has warranty
     */
    protected function hasWarranty(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->warranty_type_id !== null
        );
    }

    // Boot
    protected static function booted(): void
    {
        static::creating(function ($quote) {
            if (empty($quote->code)) {
                $quote->code = app(\App\Services\CodeGeneratorService::class)->generate('quote', [
                    'year' => now()->year,
                ]);
            }
        });
    }
}
