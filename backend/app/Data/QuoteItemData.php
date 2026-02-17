<?php

namespace App\Data;

use App\Enums\QuoteItemType;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

class QuoteItemData extends Data
{
    public function __construct(
        // Required fields
        #[Required]
        public QuoteItemType $type,

        #[Required, Max(1000)]
        public string $description,

        // Optional fields
        public int|Optional $id = new Optional,

        public ?int $quote_id = null,

        public ?int $parent_id = null,

        #[Exists('products', 'id')]
        public ?int $product_id = null,

        public ?int $price_list_item_id = null,

        #[Max(100)]
        public ?string $code = null,

        public ?string $notes = null,

        #[Min(0)]
        public int $sort_order = 0,

        // Pricing
        #[Max(50)]
        public ?string $unit = null,

        #[Min(0)]
        public ?float $quantity = null,

        #[Min(0)]
        public ?float $unit_price = null,

        #[Min(0), Max(100)]
        public float $discount_percentage = 0,

        // Calculated (with defaults)
        public float $subtotal = 0,

        public float $discount_amount = 0,

        public float $total = 0,

        // IVA riga
        #[Min(0), Max(100)]
        public ?float $vat_rate = null,

        public float $vat_amount = 0,

        public float $total_with_vat = 0,

        // Flags
        public bool $hide_unit_price = false,

        public bool $include_image = false,

        // Relazioni (output only)
        public ProductData|Lazy|Optional $product = new Optional,

        public PriceListItemData|Lazy|Optional $priceListItem = new Optional,

        public QuoteItemData|Lazy|Optional $parent = new Optional,

        /** @var DataCollection<QuoteItemData>|Lazy|Optional */
        public DataCollection|Lazy|Optional $children = new Optional,
    ) {}

    public static function rules(): array
    {
        return [
            'quote_id' => ['nullable', 'integer'],
            'parent_id' => ['nullable', 'integer'],
            'product_id' => ['nullable', 'exists:products,id'],
            'price_list_item_id' => ['nullable', 'integer'],
            'type' => ['required'],
            'code' => ['nullable', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:1000'],
            'notes' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'total' => ['nullable', 'numeric', 'min:0'],
            'vat_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'vat_amount' => ['nullable', 'numeric', 'min:0'],
            'total_with_vat' => ['nullable', 'numeric', 'min:0'],
            'hide_unit_price' => ['nullable', 'boolean'],
            'include_image' => ['nullable', 'boolean'],
        ];
    }
}
