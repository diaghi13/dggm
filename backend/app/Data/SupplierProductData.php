<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;

class SupplierProductData extends Data
{
    public function __construct(
        #[Nullable]
        public ?int $id,

        #[Required]
        #[Exists('suppliers', 'id')]
        public int $supplier_id,

        #[Required]
        #[Exists('products', 'id')]
        public int $product_id,

        #[Nullable]
        #[StringType]
        #[Max(100)]
        public ?string $supplier_product_code,

        #[Nullable]
        #[StringType]
        #[Max(13)]
        public ?string $supplier_ean,

        #[Required]
        #[Numeric]
        #[Min(0)]
        public float $purchase_price,

        #[Nullable]
        #[Numeric]
        #[Min(0)]
        public ?float $wholesale_price,

        #[Nullable]
        #[Numeric]
        #[Min(0)]
        public ?float $retail_price,

        #[Nullable]
        #[Exists('discount_families', 'id')]
        public ?int $discount_family_id,

        #[Nullable]
        #[Numeric]
        #[Between(0, 100)]
        public ?float $manual_discount_1,

        #[Nullable]
        #[Numeric]
        #[Between(0, 100)]
        public ?float $manual_discount_2,

        #[Nullable]
        #[Numeric]
        #[Between(0, 100)]
        public ?float $manual_discount_3,

        #[Nullable]
        #[Numeric]
        #[Min(1)]
        public ?int $package_quantity,

        #[Nullable]
        #[Numeric]
        #[Min(1)]
        public ?int $minimum_order_quantity,

        #[Nullable]
        #[Numeric]
        #[Min(1)]
        public ?int $maximum_order_quantity,

        #[Nullable]
        #[Numeric]
        #[Min(1)]
        public ?int $multiple_order_quantity,

        #[Nullable]
        #[Numeric]
        #[Min(0)]
        public ?int $lead_time_days,

        #[Nullable]
        #[Exists('payment_terms', 'id')]
        public ?int $payment_term_id,

        #[Nullable]
        #[Numeric]
        #[Min(0)]
        public ?float $price_multiplier,

        #[Nullable]
        #[StringType]
        #[Max(3)]
        public ?string $currency,

        #[Nullable]
        #[WithCast(DateTimeInterfaceCast::class, format: 'Y-m-d')]
        public ?\DateTime $last_price_update,

        #[Nullable]
        public ?bool $is_preferred_supplier,

        #[Nullable]
        public ?bool $is_active,

        #[Nullable]
        #[StringType]
        public ?string $notes,

        // Relationships (Lazy loaded)
        public SupplierData|Lazy|null $supplier = null,
        public ProductData|Lazy|null $product = null,
        public DiscountFamilyData|Lazy|null $discountFamily = null,
        public PaymentTermData|Lazy|null $paymentTerm = null,

        // Computed properties (from model accessors)
        #[Nullable]
        public ?float $final_price = null,

        #[Nullable]
        public ?array $effective_discounts = null,

        // Timestamps
        #[Nullable]
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTime $created_at = null,

        #[Nullable]
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTime $updated_at = null,
    ) {}
}
