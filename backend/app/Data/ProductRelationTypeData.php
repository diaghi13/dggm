<?php

namespace App\Data;

use App\Models\ProductRelationType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

/**
 * ProductRelationTypeData DTO
 *
 * Tipologie di relazioni tra prodotti (component, container, accessory, etc.)
 */
class ProductRelationTypeData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required, Max(50)]
        public string $code,

        #[Required, Max(100)]
        public string $name,

        #[Nullable]
        public ?string $description,

        #[Nullable, Max(50)]
        public ?string $icon,

        #[Nullable, Max(7)]
        public ?string $color,

        public int $sort_order,

        #[BooleanType]
        public bool $is_active,
    ) {}

    public static function fromRequest(array $data): self
    {
        return self::from([
            ...$data,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public static function fromModel(ProductRelationType $type): self
    {
        return new self(
            id: $type->id,
            code: $type->code,
            name: $type->name,
            description: $type->description,
            icon: $type->icon,
            color: $type->color,
            sort_order: $type->sort_order,
            is_active: $type->is_active,
        );
    }
}
