<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_name',
        'vat_number',
        'tax_code',
        'email',
        'phone',
        'mobile',
        'website',
        'address',
        'city',
        'province',
        'postal_code',
        'country',
        'payment_terms',
        'delivery_terms',
        'discount_percentage',
        'iban',
        'bank_name',
        'contact_person',
        'contact_email',
        'contact_phone',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_percentage' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Computed attributes
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->postal_code,
            $this->city,
            $this->province ? "({$this->province})" : null,
            $this->country !== 'Italy' ? $this->country : null,
        ]);

        return implode(', ', $parts);
    }
}
