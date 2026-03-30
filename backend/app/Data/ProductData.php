<?php

namespace App\Data;

use App\Enums\KitType;
use App\Enums\ProductType;
use App\Models\Product;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\MergeValidationRules;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
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

        #[Max(50)]
        public ?string $internal_code,

        #[Max(13)]
        public ?string $ean,

        #[Max(20)]
        public ?string $etim_code,

        #[Max(255)]
        public string $name,

        #[Max(1000)]
        public ?string $description,

        #[Exists('product_categories', 'id')]
        public ?int $category_id,

        #[Exists('product_brands', 'id')]
        public ?int $brand_id,

        public ProductType $product_type,

        public ?KitType $kit_type,

        // Package
        public bool|Optional $is_package,

        #[Min(0)]
        public ?float $package_weight,

        #[Min(0)]
        public ?float $package_volume,

        #[Max(100)]
        public ?string $package_dimensions,

        // Rental
        public bool|Optional $is_rentable,

        public string|Optional $ownership_type,
        public bool|Optional $is_premium,
        public ?float $subrental_markup,
        public bool|Optional $rental_price_estimated,
        public ?float $estimated_base_day,

        #[Min(0)]
        public int|Optional $quantity_out_on_rental,

        #[Max(20)]
        public ?string $unit,

        // Standard cost (inventory valuation only, NOT sale price)
        #[Min(0)]
        public ?float $standard_cost,

        // Manufacturer reference prices (NOT for sale)
        #[Min(0)]
        public ?float $manufacturer_cost_price,

        #[Min(0)]
        public ?float $manufacturer_retail_price,

        #[Min(0), Max(1000)]
        public ?float $sale_markup_percent,

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
        public ?float $reorder_level,

        #[Min(0)]
        public ?float $reorder_quantity,

        #[Min(0)]
        public ?int $lead_time_days,

        #[Max(255)]
        public ?string $location,

        public ?string $notes,

        // Status
        public ?bool $is_active,

        public bool $is_labor_role,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,
        public ?string $deleted_at,

        // Lazy relationships (loaded only when Eloquent relation is loaded)
        public ProductCategoryData|Lazy|null $category = null,
        public ProductBrandData|Lazy|null $brand = null,
        public SupplierData|Lazy|null $defaultSupplier = null,
        #[DataCollectionOf(ProductRelationData::class)]
        public DataCollection|Lazy|null $relations = null,
        #[DataCollectionOf(ProductMediaData::class)]
        public DataCollection|Lazy|null $media = null,
        #[DataCollectionOf(PriceListItemData::class)]
        public DataCollection|Lazy|null $priceListItems = null,

        // Computed properties (read-only from model accessors)
        #[Computed]
        public float|Optional $composite_total_cost = 0,
        #[Computed]
        public float|Optional $total_stock = 0,
        #[Computed]
        public float|Optional $available_stock = 0,
    ) {}

    /**
     * Create ProductData from Product model with proper Lazy handling
     */
    public static function fromModel(Product $product): self
    {
        return new self(
            id: $product->id,
            code: $product->code,
            internal_code: $product->internal_code,
            ean: $product->ean,
            etim_code: $product->etim_code,
            name: $product->name,
            description: $product->description,
            category_id: $product->category_id,
            brand_id: $product->brand_id,
            product_type: $product->product_type,
            kit_type: $product->kit_type,
            is_package: $product->is_package,
            package_weight: $product->package_weight,
            package_volume: $product->package_volume,
            package_dimensions: $product->package_dimensions,
            is_rentable: $product->is_rentable,
            ownership_type: $product->ownership_type ?? 'owned',
            is_premium: (bool) $product->is_premium,
            subrental_markup: $product->subrental_markup !== null ? (float) $product->subrental_markup : null,
            rental_price_estimated: (bool) $product->rental_price_estimated,
            estimated_base_day: $product->estimated_base_day !== null ? (float) $product->estimated_base_day : null,
            quantity_out_on_rental: $product->quantity_out_on_rental,
            unit: $product->unit,
            standard_cost: $product->standard_cost,
            manufacturer_cost_price: $product->manufacturer_cost_price,
            manufacturer_retail_price: $product->manufacturer_retail_price,
            sale_markup_percent: $product->sale_markup_percent,
            barcode: $product->barcode,
            qr_code: $product->qr_code,
            default_supplier_id: $product->default_supplier_id,
            reorder_level: $product->reorder_level,
            reorder_quantity: $product->reorder_quantity,
            lead_time_days: $product->lead_time_days,
            location: $product->location,
            notes: $product->notes,
            is_active: $product->is_active,
            is_labor_role: (bool) $product->is_labor_role,
            created_at: $product->created_at?->toIsoString() ?? '',
            updated_at: $product->updated_at?->toIsoString() ?? '',
            deleted_at: $product->deleted_at?->toIsoString(),
            // Lazy relationships with proper whenLoaded
            category: Lazy::whenLoaded('category', $product, fn () => ProductCategoryData::from($product->category)),
            brand: Lazy::whenLoaded('brand', $product, fn () => ProductBrandData::from($product->brand)),
            defaultSupplier: Lazy::whenLoaded('defaultSupplier', $product, fn () => SupplierData::from($product->defaultSupplier)),
            relations: Lazy::whenLoaded('relations', $product, fn () => ProductRelationData::collect($product->relations)),
            media: Lazy::whenLoaded('media', $product, fn () => ProductMediaData::collect($product->media)),
            priceListItems: Lazy::whenLoaded('priceListItems', $product, fn () => PriceListItemData::collect($product->priceListItems)),
            // Computed properties from model accessors
            composite_total_cost: $product->composite_total_cost,
            total_stock: $product->total_stock,
            available_stock: $product->available_stock,
        );
    }

    /**
     * Validation messages
     */
    public static function messages(): array
    {
        return [
            // Code fields
            'code.required' => 'Il codice prodotto è obbligatorio.',
            'code.max' => 'Il codice non può superare 255 caratteri.',
            'code.unique' => 'Questo codice prodotto è già in uso.',
            'internal_code.max' => 'Il codice interno non può superare 50 caratteri.',
            'ean.max' => 'Il codice EAN non può superare 13 caratteri.',
            'etim_code.max' => 'Il codice ETIM non può superare 20 caratteri.',

            // Basic info
            'name.required' => 'Il nome del prodotto è obbligatorio.',
            'name.max' => 'Il nome non può superare 255 caratteri.',
            'description.max' => 'La descrizione non può superare 1000 caratteri.',

            // Foreign keys
            'category_id.exists' => 'La categoria selezionata non esiste.',
            'brand_id.exists' => 'Il brand selezionato non esiste.',
            'default_supplier_id.exists' => 'Il fornitore selezionato non esiste.',

            // Package
            'package_weight.min' => 'Il peso deve essere maggiore o uguale a zero.',
            'package_volume.min' => 'Il volume deve essere maggiore o uguale a zero.',
            'package_dimensions.max' => 'Le dimensioni non possono superare 100 caratteri.',

            // Rental
            'quantity_out_on_rental.min' => 'La quantità in affitto deve essere maggiore o uguale a zero.',
            'unit.max' => 'L\'unità di misura non può superare 20 caratteri.',

            // Pricing (manufacturer reference only)
            'standard_cost.min' => 'Il costo standard deve essere maggiore o uguale a zero.',
            'manufacturer_cost_price.min' => 'Il prezzo di costo del produttore deve essere maggiore o uguale a zero.',
            'manufacturer_retail_price.min' => 'Il prezzo al dettaglio del produttore deve essere maggiore o uguale a zero.',
            'sale_markup_percent.min' => 'Il margine di vendita deve essere maggiore o uguale a zero.',
            'sale_markup_percent.max' => 'Il margine di vendita non può superare il 1000%.',

            // Identifiers
            'barcode.max' => 'Il codice a barre non può superare 255 caratteri.',
            'barcode.unique' => 'Questo codice a barre è già in uso.',
            'qr_code.max' => 'Il codice QR non può superare 255 caratteri.',

            // Inventory
            'reorder_level.min' => 'Il livello di riordino deve essere maggiore o uguale a zero.',
            'reorder_quantity.min' => 'La quantità di riordino deve essere maggiore o uguale a zero.',
            'lead_time_days.min' => 'I giorni di consegna devono essere maggiori o uguali a zero.',
            'location.max' => 'La posizione non può superare 255 caratteri.',
        ];
    }

    public static function rules(ValidationContext $context): array
    {
        $productId = $context->payload['id'] ?? null;

        return [
            'code' => [Rule::unique('products', 'code')->ignore($productId)],
            'barcode' => [Rule::unique('products', 'barcode')->ignore($productId)],
            'ownership_type' => ['nullable', 'string', 'in:owned,subrental,mixed'],
            'kit_type' => ['nullable', 'string', 'in:distributed,assembled'],
            'is_premium' => ['nullable', 'boolean'],
            'subrental_markup' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rental_price_estimated' => ['nullable', 'boolean'],
            'estimated_base_day' => ['nullable', 'numeric', 'min:0'],
            'is_labor_role' => ['nullable', 'boolean'],
        ];
    }
}
