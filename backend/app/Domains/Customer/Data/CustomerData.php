<?php

namespace App\Domains\Customer\Data;

use App\Enums\CustomerType;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\RequiredIf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class CustomerData extends Data
{
    public function __construct(
        public int|Optional $id,
        #[Required, Enum(CustomerType::class)]
        public CustomerType $type,

        #[RequiredIf('type', CustomerType::INDIVIDUAL)]
        public ?string $first_name,
        #[RequiredIf('type', CustomerType::INDIVIDUAL)]
        public ?string $last_name,

        #[RequiredIf('type', CustomerType::COMPANY)]
        public ?string $company_name,

        #[RequiredIf('type', CustomerType::COMPANY)]
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
        public ?string $display_name,
    ) {}

    public static function rules(): array
    {
        return [
            'tax_code' => [
                Rule::requiredIf(
                    fn () => request()->input('type') === CustomerType::INDIVIDUAL->value
                        && ! request()->filled('email')
                ),
                'nullable',
                'string',
                Rule::unique('customers', 'tax_code'),
            ],
            'email' => [
                Rule::requiredIf(
                    fn () => request()->input('type') === CustomerType::INDIVIDUAL->value
                        && ! request()->filled('tax_code')
                ),
                'nullable',
                'string',
                Rule::unique('customers', 'email'),
                'email',
            ],
        ];
    }
}
