<?php

namespace App\Domains\Product\Data;

use App\Domains\Product\Models\ProductBrand;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ProductBrandData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Max(255)]
        public string $name,

        #[Max(10), Unique('product_brands', 'code')]
        public string|Optional $code,

        #[Max(1000)]
        public ?string $description,

        #[Max(500)]
        public ?string $logo_url,

        #[Max(500)]
        public ?string $website,

        public bool|Optional $is_active,
    ) {}

    public static function fromModel(ProductBrand $brand): self
    {
        return new self(
            id: $brand->id,
            name: $brand->name,
            code: $brand->code ?? Optional::create(),
            description: $brand->description,
            logo_url: $brand->logo_url,
            website: $brand->website,
            is_active: $brand->is_active ?? true,
        );
    }
}
