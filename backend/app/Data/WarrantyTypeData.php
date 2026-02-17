<?php

namespace App\Data;

use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Support\Validation\ValidationContext;

class WarrantyTypeData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Max(255)]
        public string $name,

        #[Min(0)]
        public ?int $years,

        public ?string $description,

        /** @var array<string>|null */
        public ?array $exclusions,

        public bool $is_default = false,

        public bool $is_active = true,

        #[Min(0)]
        public int $sort_order = 0,
    ) {}

    public static function rules(ValidationContext $context): array
    {
        $warrantyTypeId = $context->payload['id'] ?? null;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('warranty_types', 'name')->ignore($warrantyTypeId)],
            'years' => ['nullable', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'exclusions' => ['nullable', 'array'],
            'exclusions.*' => ['string', 'max:500'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
