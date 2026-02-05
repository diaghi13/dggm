<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class SettingData extends Data
{
    public function __construct(
        #[Nullable]
        public ?int $id,

        #[Required, Max(255)]
        public string $key,

        #[Nullable]
        public mixed $value,

        #[Nullable, Max(50), In(['string', 'number', 'boolean', 'json', 'email', 'url', 'color', 'date', 'datetime', 'file', 'enum'])]
        public ?string $type,

        #[Nullable, Max(100)]
        public ?string $group,

        #[Nullable, Exists('users', 'id')]
        public ?int $user_id,

        public bool $is_public,

        #[Nullable]
        public ?string $description,

        // Validation & constraints
        #[Nullable]
        public ?array $validation_rules,

        #[Nullable]
        public ?array $allowed_values, // For ENUM type

        #[Nullable]
        public ?float $min_value, // For NUMBER type

        #[Nullable]
        public ?float $max_value, // For NUMBER type

        #[Nullable]
        public mixed $default_value, // Default value for reset

        public int $order = 0, // Display order

        public bool $is_feature_flag = false, // Is this a feature flag?

        // Metadata (read-only, not validated)
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}
}
