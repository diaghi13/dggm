<?php

namespace App\Data;

use App\Enums\PriceListAdjustmentType;
use App\Enums\PriceListAppliesTo;
use App\Enums\PriceListCalculationMode;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;

class PriceListData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required, Max(100)]
        public string $name,

        #[Required, Max(50)]
        public string $code,

        public ?string $description,

        #[Required]
        public PriceListCalculationMode $calculation_mode,

        #[Required]
        public PriceListAdjustmentType $adjustment_type,

        public ?float $adjustment_value,

        #[Required]
        public PriceListAppliesTo $applies_to,

        #[Exists('product_categories', 'id')]
        public ?int $category_id,

        #[Max(50)]
        public ?string $department_filter,

        public ?string $valid_from,
        public ?string $valid_to,
        public ?bool $is_active,
        public ?bool $is_default,
        public ?int $priority,

        // Relationships
        public ProductCategoryData|Lazy|null $category = null,

        /** @var DataCollection<PriceListItemData>|Lazy|null */
        public DataCollection|Lazy|null $items = null,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:50', 'unique:price_lists,code'],
            'description' => ['nullable', 'string'],
            'calculation_mode' => ['required'],
            'adjustment_type' => ['required'],
            'adjustment_value' => ['nullable', 'numeric'],
            'applies_to' => ['required'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'department_filter' => ['nullable', 'string', 'max:50'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'priority' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
