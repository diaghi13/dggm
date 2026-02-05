<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Confirmed;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class ResetPasswordData extends Data
{
    public function __construct(
        #[Required, Email]
        public string $email,

        #[Required, Min(8), Confirmed]
        public string $password,

        public ?string $password_confirmation,

        #[Required]
        public string $token,
    ) {}
}
