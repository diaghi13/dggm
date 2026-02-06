<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;

class PriceListItemData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required, Exists('price_lists', 'id')]
        public int $price_list_id,

        #[Required, Exists('products', 'id')]
        public int $product_id,

        #[Required]
        public float $sale_price,

        public ?bool $is_manual_price,
        public ?float $rental_daily,
        public ?float $rental_weekly,
        public ?float $rental_monthly,
        public ?bool $is_manual_rental,
        public ?bool $is_active,
        public ?string $notes,

        // Relationships
        public PriceListData|Lazy|null $priceList = null,
        public ProductData|Lazy|null $product = null,

        // Computed final prices
        #[Computed]
        public ?float $final_sale_price = null,

        #[Computed]
        public ?float $final_rental_daily = null,

        #[Computed]
        public ?float $final_rental_weekly = null,

        #[Computed]
        public ?float $final_rental_monthly = null,
    ) {}

    public static function rules(): array
    {
        return [
            'price_list_id' => ['required', 'exists:price_lists,id'],
            'product_id' => ['required', 'exists:products,id'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'is_manual_price' => ['nullable', 'boolean'],
            'rental_daily' => ['nullable', 'numeric', 'min:0'],
            'rental_weekly' => ['nullable', 'numeric', 'min:0'],
            'rental_monthly' => ['nullable', 'numeric', 'min:0'],
            'is_manual_rental' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
