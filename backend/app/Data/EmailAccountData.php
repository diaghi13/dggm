<?php

namespace App\Data;

use App\Models\EmailAccount;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Support\Validation\ValidationContext;

class EmailAccountData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Max(255)]
        public string $name,

        #[Required]
        public string $provider,

        #[Required]
        public string $from_email,

        #[Required, Max(255)]
        public string $from_name,

        // SMTP
        public ?string $smtp_host = null,

        public ?int $smtp_port = null,

        public ?string $smtp_encryption = null,

        public ?string $smtp_username = null,

        // Sensitive: excluded from output via fromModel (always null in output)
        public ?string $smtp_password = null,

        // OAuth (never in output)
        public ?string $oauth_access_token = null,

        public ?string $oauth_refresh_token = null,

        // Firma
        public ?string $signature = null,

        public ?string $signature_plain = null,

        // Stato (readonly for output)
        public bool $is_active = true,

        public bool $is_default = false,

        public ?string $last_tested_at = null,

        public ?bool $last_test_success = null,

        public ?string $last_test_error = null,

        public ?string $created_at = null,
    ) {}

    public static function rules(ValidationContext $context): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', Rule::in(['smtp', 'gmail', 'outlook', 'ses', 'mailgun'])],
            'from_email' => ['required', 'email'],
            'from_name' => ['required', 'string', 'max:255'],
            'smtp_host' => ['nullable', 'string', 'max:255'],
            'smtp_port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'smtp_encryption' => ['nullable', 'string', Rule::in(['tls', 'ssl'])],
            'smtp_username' => ['nullable', 'string', 'max:255'],
            'smtp_password' => ['nullable', 'string'],
            'oauth_access_token' => ['nullable', 'string'],
            'oauth_refresh_token' => ['nullable', 'string'],
            'signature' => ['nullable', 'string'],
            'signature_plain' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }

    public static function fromModel(EmailAccount $account): self
    {
        return new self(
            id: $account->id,
            name: $account->name,
            provider: $account->provider,
            from_email: $account->from_email,
            from_name: $account->from_name,
            smtp_host: $account->smtp_host,
            smtp_port: $account->smtp_port,
            smtp_encryption: $account->smtp_encryption,
            smtp_username: $account->smtp_username,
            smtp_password: null, // Never expose password in output
            oauth_access_token: null, // Never expose tokens in output
            oauth_refresh_token: null, // Never expose tokens in output
            signature: $account->signature,
            signature_plain: $account->signature_plain,
            is_active: (bool) $account->is_active,
            is_default: (bool) $account->is_default,
            last_tested_at: $account->last_tested_at?->toIso8601String(),
            last_test_success: $account->last_test_success,
            last_test_error: $account->last_test_error,
            created_at: $account->created_at?->toIso8601String(),
        );
    }
}
