<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * User Data Transfer Object
 *
 * Used for both input validation and output serialization of users.
 * Replaces both FormRequest (for validation) and Resource (for API responses).
 */
class UserData extends Data
{
    public function __construct(
        // Basic Info (Required)
        #[Required]
        #[Max(255)]
        public string $name,

        #[Required]
        #[Email]
        #[Max(255)]
        public string $email,

        // Status (Optional with default true)
        public bool $is_active = true,

        // Roles (array of role names - Optional for input)
        /** @var array<string> */
        public array $roles = [],

        // Primary (Optional for output)
        public int|Optional $id = new Optional,

        // Password (optional on update, required on create - validated in service)
        #[Min(8)]
        #[Max(255)]
        public string|null|Optional $password = new Optional,

        #[Min(8)]
        #[Max(255)]
        public string|null|Optional $password_confirmation = new Optional,

        // Relationships for output (Optional for input)
        public array|Optional $permissions = new Optional,
        public mixed $worker = new Optional,

        // Timestamps (Optional)
        public string|Optional $created_at = new Optional,
        public string|Optional $updated_at = new Optional,
    ) {}

    /**
     * Create UserData from User model with relationships
     */
    public static function fromModel(\App\Models\User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            password: Optional::create(),
            password_confirmation: Optional::create(),
            is_active: true, // Default since model doesn't have it yet
            roles: $user->roles->pluck('name')->toArray(),
            permissions: $user->getAllPermissions()->pluck('name')->toArray(),
            worker: $user->worker ?? Optional::create(),
            created_at: $user->created_at?->toISOString() ?? '',
            updated_at: $user->updated_at?->toISOString() ?? '',
        );
    }
}
