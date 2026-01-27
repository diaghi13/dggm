<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class CustomerData extends Data
{
    public function __construct(
        public ?string $type,
        public ?string $first_name,
        public ?string $last_name,
        public ?string $company_name,
        public ?string $vat_number,
        public ?string $tax_code,
        public ?string $email,
        public ?string $phone,
        public ?string $mobile,
        public ?string $address,
        public ?string $city,
        public ?string $province,
        public ?string $postal_code,
        public ?string $country,
        public ?string $payment_terms,
        public ?float $discount_percentage,
        public ?string $notes,
        public ?bool $is_active,
    )
    {}
}
