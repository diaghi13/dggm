<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Role Data Transfer Object
 *
 * Used for both input validation and output serialization of roles.
 * Replaces both FormRequest (for validation) and Resource (for API responses).
 *
 * Features:
 * - Validation attributes on properties (Required, Unique, Max)
 * - Automatic conversion from/to Role model
 * - Type-safe data structure
 *
 * Usage:
 * - Input: $roleData = RoleData::from($request->all());
 * - Output: return RoleData::from($role);
 */
class RoleData extends Data
{
    public function __construct(
        // Primary
        public int|Optional $id,

        // Name is immutable after creation (unique constraint)
        #[Required]
        #[Max(255)]
        public string $name,

        // Display name (auto-generated from name if not provided)
        #[Max(255)]
        public string|null|Optional $display_name,

        // Description
        #[Max(1000)]
        public string|null|Optional $description,

        // Guard name (usually 'web')
        #[Max(255)]
        public string $guard_name,

        // Permissions (array of permission names)
        /** @var array<string> */
        public array $permissions,

        // Metadata
        public int|Optional $permissions_count,
        public int|Optional $users_count,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,
    ) {}

    /**
     * Additional validation rules for unique constraint
     * Handles update scenario where name should be unique except for current role
     */
    public static function rules(): array
    {
        return [
            'name' => function (?int $id = null) {
                return [
                    'required',
                    'string',
                    'max:255',
                    \Illuminate\Validation\Rule::unique('roles', 'name')->ignore($id),
                ];
            },
        ];
    }

    /**
     * Check if role is a system role (cannot be deleted)
     */
    public function isSystemRole(): bool
    {
        return in_array($this->name, [
            'super-admin',
            'admin',
        ], true);
    }
}
