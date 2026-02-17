<?php

namespace App\Models;

use App\Enums\ContractorType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contractor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'company_name',
        'vat_number',
        'tax_code',
        'contractor_type',
        'email',
        'phone',
        'website',
        'address',
        'city',
        'province',
        'postal_code',
        'country',
        'contact_person',
        'contact_email',
        'contact_phone',
        'iban',
        'bank_name',
        'payment_terms',
        'specializations',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'contractor_type' => ContractorType::class,
            'specializations' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class, 'contractor_company_id');
    }

    public function rates(): HasMany
    {
        return $this->hasMany(ContractorRate::class);
    }

    public function laborCosts(): HasMany
    {
        return $this->hasMany(SiteLaborCost::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, ContractorType $type)
    {
        return $query->where('contractor_type', $type);
    }

    public function scopeCooperatives($query)
    {
        return $query->where('contractor_type', ContractorType::Cooperative);
    }

    public function scopeSubcontractors($query)
    {
        return $query->where('contractor_type', ContractorType::Subcontractor);
    }

    public function scopeWithSpecialization($query, string $specialization)
    {
        return $query->whereJsonContains('specializations', $specialization);
    }

    // ==================== ACCESSORS ====================

    public function getActiveWorkersCountAttribute(): int
    {
        return $this->workers()->active()->count();
    }

    public function getTotalInvoicedAttribute(): float
    {
        return $this->laborCosts()
            ->where('is_invoiced', true)
            ->sum('total_cost') ?? 0;
    }

    public function getPendingInvoicesAmountAttribute(): float
    {
        return $this->laborCosts()
            ->where('is_invoiced', false)
            ->sum('total_cost') ?? 0;
    }

    // ==================== METHODS ====================

    /**
     * Get current rate for specific service type
     */
    public function getCurrentRate(string $serviceType, ?\DateTime $date = null): ?ContractorRate
    {
        $date = $date ?? now();

        return $this->rates()
            ->where('service_type', $serviceType)
            ->where('valid_from', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', $date);
            })
            ->orderBy('valid_from', 'desc')
            ->first();
    }

    /**
     * Get all current rates
     */
    public function getCurrentRates(): \Illuminate\Support\Collection
    {
        $now = now();

        return $this->rates()
            ->where('valid_from', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', $now);
            })
            ->orderBy('service_type')
            ->get();
    }

    // ==================== BOOT ====================

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($contractor) {
            if (! $contractor->code) {
                $contractor->code = self::generateCode();
            }
        });
    }

    /**
     * Generate unique contractor code (CON-00001)
     */
    private static function generateCode(): string
    {
        return app(\App\Services\CodeGeneratorService::class)->generate('contractor');
    }
}
