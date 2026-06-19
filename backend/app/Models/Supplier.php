<?php

namespace App\Models;

use App\Data\SupplierData;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductSubrentalSupplier;
use App\Domains\Project\Models\ProjectLaborCost;
use App\Enums\PersonnelType;
use App\Enums\SupplierType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\LaravelData\WithData;

class Supplier extends Model
{
    use HasFactory, SoftDeletes, WithData;

    protected string $dataClass = SupplierData::class;

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
        return $this->hasMany(ProjectLaborCost::class, 'contractor_id');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'supplier_product')
            ->withPivot([
                'supplier_product_code',
                'supplier_ean',
                'purchase_price',
                'wholesale_price',
                'retail_price',
                'discount_family_id',
                'manual_discount_1',
                'manual_discount_2',
                'manual_discount_3',
                'package_quantity',
                'minimum_order_quantity',
                'maximum_order_quantity',
                'multiple_order_quantity',
                'lead_time_days',
                'payment_term_id',
                'price_multiplier',
                'currency',
                'last_price_update',
                'is_preferred_supplier',
                'is_active',
                'notes',
            ])
            ->withTimestamps();
    }

    public function discountFamilies(): HasMany
    {
        return $this->hasMany(DiscountFamily::class);
    }

    public function subrentalProducts(): HasMany
    {
        return $this->hasMany(ProductSubrentalSupplier::class);
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
     * Generate unique supplier code (FOR-00001)
     */
    private static function generateCode(): string
    {
        return app(\App\Services\CodeGeneratorService::class)->generate('supplier');
    }
}
