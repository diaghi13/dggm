<?php

namespace App\Models;

use App\Enums\PersonnelType;
use App\Enums\SupplierType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'company_name',
        'supplier_type',
        'personnel_type',
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
        'specializations',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'supplier_type' => SupplierType::class,
            'personnel_type' => PersonnelType::class,
            'discount_percentage' => 'decimal:2',
            'specializations' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class);
    }

    public function contractorRates(): HasMany
    {
        return $this->hasMany(ContractorRate::class, 'contractor_id');
    }

    public function laborCosts(): HasMany
    {
        return $this->hasMany(SiteLaborCost::class, 'contractor_id');
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, SupplierType $type)
    {
        return $query->where('supplier_type', $type);
    }

    public function scopeMaterialsSuppliers($query)
    {
        return $query->whereIn('supplier_type', [SupplierType::Materials, SupplierType::Both]);
    }

    public function scopePersonnelSuppliers($query)
    {
        return $query->whereIn('supplier_type', [SupplierType::Personnel, SupplierType::Both]);
    }

    public function scopeByPersonnelType($query, PersonnelType $type)
    {
        return $query->where('personnel_type', $type);
    }

    // ==================== ACCESSORS ====================

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

    public function getProvidesMaterialsAttribute(): bool
    {
        return $this->supplier_type?->providesMaterials() ?? false;
    }

    public function getProvidesPersonnelAttribute(): bool
    {
        return $this->supplier_type?->providesPersonnel() ?? false;
    }

    public function getActiveWorkersCountAttribute(): int
    {
        return $this->workers()->active()->count();
    }

    // ==================== BOOT ====================

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($supplier) {
            if (! $supplier->code) {
                $supplier->code = self::generateCode();
            }
        });
    }

    /**
     * Generate unique supplier code (SUP-00001)
     */
    private static function generateCode(): string
    {
        $lastSupplier = self::withTrashed()
            ->where('code', 'like', 'SUP-%')
            ->orderByRaw('CAST(SUBSTRING(code, 5) AS UNSIGNED) DESC')
            ->first();

        if (! $lastSupplier) {
            return 'SUP-00001';
        }

        $lastNumber = (int) substr($lastSupplier->code, 4);
        $newNumber = $lastNumber + 1;

        return 'SUP-'.str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }
}
