<?php

namespace App\Data;

use App\Enums\ProductType;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\MergeValidationRules;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Support\Validation\ValidationContext;

/**
 * Product Data Transfer Object
 *
 * Represents a product (article, service, or composite product).
 */
#[MergeValidationRules]
class ProductData extends Data
{
    public function __construct(
        // Primary
        public int|Optional $id,

        // Unique except self for updates
        #[Max(255)]
        public string $code,

        #[Max(255)]
        public string $name,

        #[Max(1000)]
        public ?string $description,

        public ?int $category_id,

        public ProductType $product_type,

        #[Max(20)]
        public string $unit,

        // Pricing
        #[Min(0)]
        public float $standard_cost,

        #[Min(0)]
        public float $purchase_price,

        #[Min(0), Max(100)]
        public float $markup_percentage,

        #[Min(0)]
        public float $sale_price,

        // Rental pricing
        #[Min(0)]
        public float $rental_price_daily,

        #[Min(0)]
        public float $rental_price_weekly,

        #[Min(0)]
        public float $rental_price_monthly,

        // Identifiers
        #[Max(255)]
        public ?string $barcode,

        #[Max(255)]
        public ?string $qr_code,

        // Supplier
        #[Exists('suppliers', 'id')]
        public ?int $default_supplier_id,

        // Inventory
        #[Min(0)]
        public float $reorder_level,

        #[Min(0)]
        public float $reorder_quantity,

        #[Min(0)]
        public int $lead_time_days,

        #[Max(255)]
        public ?string $location,

        public ?string $notes,

        // Rental
        public bool $is_rentable,

        #[Min(0)]
        public int $quantity_out_on_rental,

        // Status
        public bool $is_active,

        // Package
        public bool $is_package,

        #[Min(0)]
        public ?float $package_weight,

        #[Min(0)]
        public ?float $package_volume,

        #[Max(100)]
        public ?string $package_dimensions,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,
        public ?string $deleted_at,

        // Lazy relationships
        #[DataCollectionOf(ProductRelationData::class)]
        public Lazy|Collection|array $relations = [],
        public Lazy|SupplierData|null $defaultSupplier = null,
        public Lazy|ProductCategoryData|null $category = null,

        // Computed properties (read from model accessors)
        #[Computed]
        public float $calculated_sale_price = 0,

        #[Computed]
        public float $composite_total_cost = 0,

        #[Computed]
        public float $total_stock = 0,

        #[Computed]
        public float $available_stock = 0,

        #[Computed]
        public float $calculate_sale_price = 0,
    ) {}

    public function fromModel(Product $product)
    {
        return new self(
            id: $product->id,
            code: $product->code,
            name: $product->name,
            description: $product->description,
            category_id: $product->category_id,
            product_type: $product->product_type,
            unit: $product->unit,
            standard_cost: $product->standard_cost,
            purchase_price: $product->purchase_price,
            markup_percentage: $product->markup_percentage,
            sale_price: $product->sale_price,
            rental_price_daily: $product->rental_price_daily,
            rental_price_weekly: $product->rental_price_weekly,
            rental_price_monthly: $product->rental_price_monthly,
            barcode: $product->barcode,
            qr_code: $product->qr_code,
            default_supplier_id: $product->default_supplier_id,
            reorder_level: $product->reorder_level,
            reorder_quantity: $product->reorder_quantity,
            lead_time_days: $product->lead_time_days,
            location: $product->location,
            notes: $product->notes,
            is_rentable: $product->is_rentable,
            quantity_out_on_rental: $product->quantity_out_on_rental,
            is_active: $product->is_active,
            is_package: $product->is_package,
            package_weight: $product->package_weight,
            package_volume: $product->package_volume,
            package_dimensions: $product->package_dimensions,
            created_at: $product->created_at,
            updated_at: $product->updated_at,
            deleted_at: $product->deleted_at,
            relations: Lazy::whenLoaded('relations', $product, fn () => ProductRelationData::collect($product->relations)),
            defaultSupplier: Lazy::whenLoaded('defaultSupplier', $product, fn () => SupplierData::from($product->defaultSupplier)),
            category: Lazy::whenLoaded('category', $product, fn () => ProductCategoryData::from($product->category)),
            calculated_sale_price: $product->calculated_sale_price,
            composite_total_cost: $product->composite_total_cost,
            total_stock: $product->total_stock,
            available_stock: $product->available_stock,
        );
    }

    /**
     * Calculate sale price from markup
     */
    public function calculatedSalePrice(): float
    {
        if ($this->markup_percentage > 0) {
            return round($this->purchase_price * (1 + ($this->markup_percentage / 100)), 2);
        }

        return $this->sale_price;
    }

    /**
     * Check if product can have components
     */
    public function canHaveComponents(): bool
    {
        return $this->product_type === ProductType::COMPOSITE;
    }

    /**
     * Check if product is inventoriable
     */
    public function isInventoriable(): bool
    {
        return $this->product_type === ProductType::ARTICLE;
    }

    /**
     * Get human-readable type label
     */
    public function typeLabel(): string
    {
        return $this->product_type->label();
    }

    /**
     * Validation messages
     */
    public static function messages(): array
    {
        return [
            'code.required' => 'Il codice prodotto è obbligatorio.',
            'code.unique' => 'Questo codice prodotto è già in uso.',
            'name.required' => 'Il nome del prodotto è obbligatorio.',
            'purchase_price.required' => 'Il prezzo di acquisto è obbligatorio.',
            'purchase_price.min' => 'Il prezzo deve essere maggiore o uguale a zero.',
            'markup_percentage.max' => 'Il margine non può superare il 100%.',
            'default_supplier_id.exists' => 'Il fornitore selezionato non esiste.',
        ];
    }

    public static function rules(ValidationContext $context): array
    {
        $productId = $context->payload['id'] ?? null;

        return [
            'code' => [Rule::unique('products', 'code')->ignore($productId)],
            'barcode' => [Rule::unique('products', 'barcode')->ignore($productId)],
        ];
    }
}
