<?php

namespace App\Data;

use App\Models\RentalProfile;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Support\Validation\ValidationContext;

class RentalProfileData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Max(255)]
        public string $name,

        #[Required, Max(100)]
        public string $sector,

        public float $exponent_curve,

        public float $decay_strength,

        public float $max_duration_reference,

        public float $duration_offset,

        public float $max_period_cap_days,

        #[BooleanType]
        public bool $is_default = false,

        #[BooleanType]
        public bool $is_active = true,

        // Output only
        public ?string $created_at = null,

        public ?string $updated_at = null,
    ) {}

    public static function rules(ValidationContext $context): array
    {
        $profileId = $context->payload['id'] ?? null;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('rental_profiles', 'name')->ignore($profileId)],
            'sector' => ['required', 'string', 'max:100'],
            'exponent_curve' => ['required', 'numeric', 'min:0'],
            'decay_strength' => ['required', 'numeric', 'min:0'],
            'max_duration_reference' => ['required', 'numeric', 'min:0'],
            'duration_offset' => ['required', 'numeric', 'min:0'],
            'max_period_cap_days' => ['required', 'numeric', 'min:0'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public static function fromModel(RentalProfile $profile): self
    {
        return new self(
            id: $profile->id,
            name: $profile->name,
            sector: $profile->sector,
            exponent_curve: (float) $profile->exponent_curve,
            decay_strength: (float) $profile->decay_strength,
            max_duration_reference: (float) $profile->max_duration_reference,
            duration_offset: (float) $profile->duration_offset,
            max_period_cap_days: (float) $profile->max_period_cap_days,
            is_default: (bool) $profile->is_default,
            is_active: (bool) $profile->is_active,
            created_at: $profile->created_at?->toIso8601String(),
            updated_at: $profile->updated_at?->toIso8601String(),
        );
    }
}
