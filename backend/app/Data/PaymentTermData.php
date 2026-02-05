<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class PaymentTermData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Max(50), Unique('payment_terms', 'code')]
        public string $code,

        #[Max(255)]
        public string $name,

        #[Max(1000)]
        public ?string $description,

        #[Min(0)]
        public int $days,

        #[In(['bank_transfer', 'riba', 'cash', 'credit_card', 'check', 'other'])]
        public string $payment_type,

        public bool $is_default,

        public bool $is_active,

        #[Min(0)]
        public int $sort_order,
    ) {}
}
