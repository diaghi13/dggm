<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Confirmed;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class ChangePasswordData extends Data
{
    public function __construct(
        #[Required]
        public string $current_password,

        #[Required, Min(8), Confirmed]
        public string $password,

        public ?string $password_confirmation,
    ) {}
}
