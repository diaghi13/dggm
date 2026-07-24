<?php

namespace App\Data;

use App\Enums\QuoteItemBillingUnit;
use App\Enums\QuoteItemType;
use Illuminate\Validation\Rule;
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

        #[Required]
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

        public QuoteItemBillingUnit $billing_unit = QuoteItemBillingUnit::Unit,

        public ?float $duration = null,

        #[Min(0)]
        public ?float $quantity = null,

        public ?float $unit_price = null,

        #[Min(0)]
        public ?float $cost_price = null,

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

        /** @var int[]|null Explicit list of media IDs to include. null = use use_in_quotes default. */
        public ?array $included_media_ids = null,

        public bool $expand_kit = false,

        // Relazioni (output only)
        public ProductData|Lazy|Optional $product = new Optional,

        public PriceListItemData|Lazy|Optional $priceListItem = new Optional,

        public QuoteItemData|Lazy|Optional $parent = new Optional,

        /** @var DataCollection<QuoteItemData>|Lazy|Optional */
        public DataCollection|Lazy|Optional $children = new Optional,

        // Computed margin (output only, not saved to DB)
        public readonly ?float $margin_amount = null,
        public readonly ?float $margin_percent = null,
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
            'description' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'billing_unit' => ['nullable', 'string', Rule::in(array_column(QuoteItemBillingUnit::cases(), 'value'))],
            'duration' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit_price' => ['nullable', 'numeric'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'subtotal' => ['nullable', 'numeric'],
            'discount_amount' => ['nullable', 'numeric'],
            'total' => ['nullable', 'numeric'],
            'vat_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'vat_amount' => ['nullable', 'numeric'],
            'total_with_vat' => ['nullable', 'numeric'],
            'hide_unit_price' => ['boolean'],
            'include_image' => ['nullable', 'boolean'],
            'included_media_ids' => ['nullable', 'array'],
            'included_media_ids.*' => ['integer'],
            'expand_kit' => ['nullable', 'boolean'],
        ];
    }

    public static function fromModel(\App\Models\QuoteItem $quoteItem): self
    {
        return new self(
            type: $quoteItem->type,
            description: $quoteItem->description,
            id: $quoteItem->id,
            quote_id: $quoteItem->quote_id,
            parent_id: $quoteItem->parent_id,
            product_id: $quoteItem->product_id,
            price_list_item_id: $quoteItem->price_list_item_id,
            code: $quoteItem->code,
            notes: $quoteItem->notes,
            sort_order: $quoteItem->sort_order,
            unit: $quoteItem->unit,
            billing_unit: $quoteItem->billing_unit ?? QuoteItemBillingUnit::Unit,
            duration: $quoteItem->duration,
            quantity: $quoteItem->quantity,
            unit_price: $quoteItem->unit_price,
            cost_price: $quoteItem->cost_price,
            discount_percentage: $quoteItem->discount_percentage,
            subtotal: $quoteItem->subtotal,
            discount_amount: $quoteItem->discount_amount,
            total: $quoteItem->total,
            vat_rate: $quoteItem->vat_rate,
            vat_amount: $quoteItem->vat_amount,
            total_with_vat: $quoteItem->total_with_vat,
            hide_unit_price: $quoteItem->hide_unit_price,
            include_image: $quoteItem->include_image,
            expand_kit: (bool) $quoteItem->expand_kit,
            children: $quoteItem->relationLoaded('children') && $quoteItem->children->isNotEmpty()
                ? self::collect($quoteItem->children, DataCollection::class)
                : new Optional,
            margin_amount: $quoteItem->margin_amount,
            margin_percent: $quoteItem->margin_percent,
        );
    }
}
