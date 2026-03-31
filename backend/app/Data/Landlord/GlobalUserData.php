<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use App\Models\Landlord\GlobalUser;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class GlobalUserData extends Data
{
    public function __construct(
        public string|Optional $id,

        #[Required, Max(255)]
        public string $name,

        #[Required, Email, Max(255)]
        public string $email,

        #[Max(20)]
        public ?string $phone,

        #[Max(20)]
        public ?string $tax_code,

        #[Max(20)]
        public ?string $fiscal_code,

        #[Max(255)]
        public ?string $address,

        #[Max(100)]
        public ?string $city,

        #[Max(5)]
        public ?string $province,

        #[Max(10)]
        public ?string $postal_code,

        #[Max(3)]
        public ?string $country,

        #[Max(34)]
        public ?string $iban,

        public ?bool $is_landlord_admin,

        public string|Optional $created_at,
    ) {}

    public static function fromModel(GlobalUser $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            phone: $user->phone,
            tax_code: $user->tax_code,
            fiscal_code: $user->fiscal_code,
            address: $user->address,
            city: $user->city,
            province: $user->province,
            postal_code: $user->postal_code,
            country: $user->country,
            iban: $user->iban,
            is_landlord_admin: $user->is_landlord_admin,
            created_at: $user->created_at?->toIsoString() ?? '',
        );
    }
}
