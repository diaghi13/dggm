<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class ForgotPasswordData extends Data
{
    public function __construct(
        #[Required, Email, Exists('users', 'email')]
        public string $email,
    ) {}
}
