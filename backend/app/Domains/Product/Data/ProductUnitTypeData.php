<?php

namespace App\Domains\Product\Data;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class ProductUnitTypeData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required, Max(10)]
        public string $code,

        #[Required, Max(50)]
        public string $name_it,

        #[Required, Max(10)]
        public string $symbol_it,

        #[Required, Max(50)]
        public string $name_en,

        #[Required, Max(10)]
        public string $symbol_en,

        public ?array $aliases,

        #[Max(20)]
        public ?string $category,

        public ?float $conversion_factor,
        public ?bool $is_active,
        public ?int $sort_order,
    ) {}

    public static function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:10', 'unique:product_unit_types,code'],
            'name_it' => ['required', 'string', 'max:50'],
            'symbol_it' => ['required', 'string', 'max:10'],
            'name_en' => ['required', 'string', 'max:50'],
            'symbol_en' => ['required', 'string', 'max:10'],
            'aliases' => ['nullable', 'array'],
            'category' => ['nullable', 'string', 'max:20'],
            'conversion_factor' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ];
    }
}
