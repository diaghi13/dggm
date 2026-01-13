<?php

namespace App\Models;

use App\Enums\QuoteItemType;
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
        'show_tax',
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
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'expiry_date' => 'date',
            'valid_until' => 'date',
            'sent_date' => 'date',
            'approved_date' => 'date',
            'subtotal' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_percentage' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'show_tax' => 'boolean',
            'tax_included' => 'boolean',
            'show_unit_prices' => 'boolean',
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
        $subtotal = $this->items()
            ->whereNull('parent_id')
            ->sum('total');

        $this->subtotal = $subtotal;
        $this->discount_amount = ($subtotal * $this->discount_percentage) / 100;
        $amountAfterDiscount = $subtotal - $this->discount_amount;
        $this->tax_amount = ($amountAfterDiscount * $this->tax_percentage) / 100;
        $this->total_amount = $amountAfterDiscount + $this->tax_amount;

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
            'code' => 'SITE-'.str_pad($this->id, 4, '0', STR_PAD_LEFT),
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

    // Boot
    protected static function booted(): void
    {
        static::creating(function ($quote) {
            if (empty($quote->code)) {
                $quote->code = 'Q-'.now()->format('Y').'-'.str_pad(
                    Quote::whereYear('created_at', now()->year)->count() + 1,
                    4,
                    '0',
                    STR_PAD_LEFT
                );
            }
        });
    }
}
