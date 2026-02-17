<?php

namespace App\Models;

use App\Enums\QuoteItemType;
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
        'site_id',
        'notes',
        'terms_and_conditions',
        'footer_text',
        // NEW: Price list and payment
        'price_list_id',
        'payment_term_id',
        'financial_resource_id',
        'deposit_percentage',
        'deposit_amount',
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
    ];

    protected function casts(): array
    {
        return [
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
        ];
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

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
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
        // First, update parent items with totals from their children
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

        // Now calculate quote totals from parent items
        // Reload items to get updated totals
        $items = $this->items()->whereNull('parent_id')->get();

        $this->subtotal = $items->sum('subtotal');
        $this->discount_amount = ($this->subtotal * $this->discount_percentage) / 100;
        $totalImponibile = $this->subtotal - $this->discount_amount;

        // IVA sommata dalle righe (già calcolata con sconto applicato)
        $this->tax_amount = $items->sum('vat_amount');
        $this->total_amount = $totalImponibile + $this->tax_amount;

        // Calcola acconto se percentuale presente
        if ($this->deposit_percentage > 0) {
            $this->deposit_amount = ($this->total_amount * $this->deposit_percentage) / 100;
        }

        $this->saveQuietly();
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'sent']);
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'sent';
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

    public function convertToSite(): ?Site
    {
        if ($this->status !== 'approved') {
            return null;
        }

        $site = Site::create([
            'code' => app(\App\Services\CodeGeneratorService::class)->generate('site'),
            'name' => $this->title,
            'customer_id' => $this->customer_id,
            'project_manager_id' => $this->project_manager_id,
            'description' => $this->description,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'quote_id' => $this->id,
            'status' => 'planned',
            'estimated_amount' => $this->total_amount,
            'is_active' => true,
        ]);

        // Create site materials from quote items (type: material)
        $this->createSiteMaterials($site);

        // Save site_id reference instead of changing status to 'converted'
        $this->update(['site_id' => $site->id]);

        return $site;
    }

    /**
     * Create site materials from quote items
     */
    protected function createSiteMaterials(Site $site): void
    {
        // Load quote items - include items, materials, and labor (exclude sections)
        $materialItems = $this->items()
            ->whereIn('type', [
                QuoteItemType::Item->value,
                QuoteItemType::Material->value,
                QuoteItemType::Labor->value,
            ])
            ->where(function ($query) {
                $query->whereNotNull('material_id')
                    ->orWhereNotNull('quantity'); // Include items with quantity even without material_id
            })
            ->get();

        foreach ($materialItems as $item) {
            // Skip if no quantity defined
            if (! $item->quantity || $item->quantity <= 0) {
                continue;
            }

            \App\Models\SiteMaterial::create([
                'site_id' => $site->id,
                'material_id' => $item->material_id, // Can be null for custom items
                'quote_item_id' => $item->id,
                'is_extra' => false, // From quote, not extra
                'planned_quantity' => $item->quantity,
                'allocated_quantity' => 0,
                'delivered_quantity' => 0,
                'used_quantity' => 0,
                'returned_quantity' => 0,
                'planned_unit_cost' => $item->unit_price ?? 0,
                'actual_unit_cost' => $item->unit_price ?? 0,
                'status' => 'planned',
                'notes' => $item->notes,
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
