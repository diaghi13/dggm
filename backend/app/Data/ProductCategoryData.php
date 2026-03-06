<?php

namespace App\Data;

use App\Models\ProductCategory;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * ProductCategoryData DTO
 *
 * Categorie prodotti con UI metadata (icon, color)
 */
class ProductCategoryData extends Data
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

        public int|Optional $sort_order,

        #[BooleanType]
        public bool|Optional $is_active,

        #[Nullable]
        public ?int $rental_profile_id,

        public ?RentalProfileData $rentalProfile,
    ) {}

    public static function fromRequest(array $data): self
    {
        return self::from([
            ...$data,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public static function fromModel(ProductCategory $category): self
    {
        return new self(
            id: $category->id,
            code: $category->code,
            name: $category->name,
            description: $category->description,
            icon: $category->icon,
            color: $category->color,
            sort_order: $category->sort_order ?? 0,
            is_active: $category->is_active ?? true,
            rental_profile_id: $category->rental_profile_id,
            rentalProfile: $category->relationLoaded('rentalProfile') && $category->rentalProfile
                ? RentalProfileData::from($category->rentalProfile)
                : null,
        );
    }
}
