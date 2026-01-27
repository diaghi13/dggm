<?php

namespace App\Data;

use App\Enums\PersonnelType;
use App\Enums\SupplierType;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\Lazy;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Supplier Data Transfer Object
 *
 * Follows Spatie Laravel Data v4 best practices:
 * - Validation attributes instead of FormRequests
 * - Computed properties for derived values
 * - Optional type for nullable fields
 * - Consistent with ProductData structure
 */
class SupplierData extends Data
{
    public function __construct(
        // Primary fields
        public int|Optional $id,

        #[Required]
        #[Max(255)]
        #[Unique('suppliers', 'code')]
        public string $code,

        #[Required]
        #[Max(255)]
        public string $company_name,

        #[Required]
        public SupplierType $supplier_type,

        public PersonnelType|Optional|null $personnel_type,

        // Contact details
        #[Max(50)]
        public string|Optional|null $vat_number,

        #[Max(50)]
        public string|Optional|null $tax_code,

        #[Email]
        #[Max(255)]
        public string|Optional|null $email,

        #[Max(50)]
        public string|Optional|null $phone,

        #[Max(50)]
        public string|Optional|null $mobile,

        #[Max(255)]
        public string|Optional|null $website,

        // Address
        #[Max(255)]
        public string|Optional|null $address,

        #[Max(100)]
        public string|Optional|null $city,

        #[Max(10)]
        public string|Optional|null $province,

        #[Max(20)]
        public string|Optional|null $postal_code,

        #[Max(100)]
        public string|Optional|null $country,

        // Business terms
        #[Max(100)]
        public string|Optional|null $payment_terms,

        #[Max(100)]
        public string|Optional|null $delivery_terms,

        #[Min(0)]
        #[Max(100)]
        public float|Optional|null $discount_percentage,

        // Banking
        #[Max(50)]
        public string|Optional|null $iban,

        #[Max(100)]
        public string|Optional|null $bank_name,

        // Contact person
        #[Max(255)]
        public string|Optional|null $contact_person,

        #[Email]
        #[Max(255)]
        public string|Optional|null $contact_email,

        #[Max(50)]
        public string|Optional|null $contact_phone,

        // Additional info
        public string|Optional|null $notes,
        public array|Optional|null $specializations,

        // Status
        public bool $is_active,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,
        public string|Optional|null $deleted_at,
    ) {}

    /**
     * Full formatted address (Computed)
     */
    #[Computed]
    public function full_address(): string
    {
        $parts = array_filter([
            is_string($this->address) ? $this->address : null,
            is_string($this->postal_code) ? $this->postal_code : null,
            is_string($this->city) ? $this->city : null,
            is_string($this->province) ? "({$this->province})" : null,
            is_string($this->country) && $this->country !== 'Italy' ? $this->country : null,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Check if supplier provides materials (Computed)
     */
    #[Computed]
    public function provides_materials(): bool
    {
        return $this->supplier_type->providesMaterials();
    }

    /**
     * Check if supplier provides personnel (Computed)
     */
    #[Computed]
    public function provides_personnel(): bool
    {
        return $this->supplier_type->providesPersonnel();
    }

    /**
     * Active workers count (Computed + Lazy)
     *
     * Only calculated when workers relationship is loaded
     */
    #[Computed]
    #[Lazy]
    public function active_workers_count(): int
    {
        if (! $this->resource?->relationLoaded('workers')) {
            return 0;
        }

        return $this->resource->workers->where('is_active', true)->count();
    }

    /**
     * Get human-readable supplier type label
     */
    public function supplierTypeLabel(): string
    {
        return $this->supplier_type->label();
    }

    /**
     * Get human-readable personnel type label
     */
    public function personnelTypeLabel(): ?string
    {
        if ($this->personnel_type instanceof PersonnelType) {
            return $this->personnel_type->label();
        }

        return null;
    }

    /**
     * Check if supplier has contact person
     */
    public function hasContactPerson(): bool
    {
        return ! empty($this->contact_person) || ! empty($this->contact_email) || ! empty($this->contact_phone);
    }

    /**
     * Check if supplier has banking info
     */
    public function hasBankingInfo(): bool
    {
        return ! empty($this->iban) || ! empty($this->bank_name);
    }
}
