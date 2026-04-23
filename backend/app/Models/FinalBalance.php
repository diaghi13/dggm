<?php

namespace App\Models;

use App\Enums\FinalBalanceStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinalBalance extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'quote_id',
        'customer_id',
        'reference_text',
        'code',
        'title',
        'status',
        'issue_date',
        'notes',
        'is_partial',
        'subtotal',
        'discount_percentage',
        'discount_amount',
        'tax_percentage',
        'tax_amount',
        'total_amount',
        'is_manual_override',
        'finalized_by_user_id',
        'finalized_at',
        'approved_by_user_id',
        'approved_at',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => FinalBalanceStatus::class,
            'issue_date' => 'date',
            'finalized_at' => 'datetime',
            'approved_at' => 'datetime',
            'is_partial' => 'boolean',
            'is_manual_override' => 'boolean',
            'subtotal' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_percentage' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    // Relationships

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(FinalBalanceItem::class)->orderBy('sort_order');
    }

    public function rootItems(): HasMany
    {
        return $this->hasMany(FinalBalanceItem::class)->whereNull('parent_id')->orderBy('sort_order');
    }

    // Methods

    public function recalculate(): void
    {
        if ($this->is_manual_override) {
            return;
        }

        $subtotal = $this->items()->sum('total');
        $discountAmount = $subtotal * ($this->discount_percentage / 100);
        $taxBase = $subtotal - $discountAmount;
        $taxAmount = $taxBase * ($this->tax_percentage / 100);

        $this->update([
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $taxBase + $taxAmount,
        ]);
    }
}
