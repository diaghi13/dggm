<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    /** @use HasFactory<\Database\Factories\CustomerFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type',
        'first_name',
        'last_name',
        'company_name',
        'vat_number',
        'tax_code',
        'email',
        'phone',
        'mobile',
        'address',
        'city',
        'province',
        'postal_code',
        'country',
        'payment_terms',
        'discount_percentage',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'discount_percentage' => 'decimal:2',
        ];
    }

    /**
     * Get the customer's full name (for individuals) or company name
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->type === 'company') {
            return $this->company_name ?? 'N/A';
        }

        return trim("{$this->first_name} {$this->last_name}") ?: 'N/A';
    }

    /**
     * Scope active customers
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope by customer type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
