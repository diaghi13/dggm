<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Permission Data Transfer Object
 *
 * Used for both input validation and output serialization of permissions.
 *
 * Features:
 * - Type-safe permission structure
 * - Automatic conversion from Permission model
 * - Grouped by module for frontend display
 * - Create/Update validation
 */
class PermissionData extends Data
{
    public function __construct(
        // Permission name (e.g., 'users.view', 'sites.create')
        #[Required]
        #[Max(255)]
        public string $name,

        // Display name (optional, defaults to name if not provided)
        #[Max(255)]
        public string|Optional $display_name = new Optional,

        // Description (optional)
        #[Max(500)]
        public string|null|Optional $description = new Optional,

        // Guard name (usually 'web', defaults to 'web')
        #[Max(255)]
        public string $guard_name = 'web',

        // Primary (Optional for input)
        public int|Optional $id = new Optional,

        // Extracted module and action from permission name
        // e.g., 'users.view' → module: 'users', action: 'view'
        public string|Optional $module = new Optional,
        public string|Optional $action = new Optional,

        // Timestamps
        public string|Optional $created_at = new Optional,
        public string|Optional $updated_at = new Optional,
    ) {}

    /**
     * Extract module and action from permission name
     * Permission naming pattern: {module}.{action}
     */
    public function withModuleAndAction(): static
    {
        $parts = explode('.', $this->name, 2);

        return new static(
            id: $this->id,
            name: $this->name,
            guard_name: $this->guard_name,
            module: $parts[0] ?? '',
            action: $parts[1] ?? '',
            created_at: $this->created_at,
            updated_at: $this->updated_at,
        );
    }
}
