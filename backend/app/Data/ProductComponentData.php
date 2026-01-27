<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\Lazy;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Product Component Data Transfer Object
 *
 * Represents a component within a composite product.
 * Follows Spatie Laravel Data v4 best practices:
 * - Validation attributes on all fields
 * - Lazy properties for nested product data
 * - Computed properties for calculated values
 * - Proper Optional handling
 */
class ProductComponentData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required]
        #[Exists('products', 'id')]
        public int $kit_product_id,

        #[Required]
        #[Exists('products', 'id')]
        public int $component_product_id,

        #[Required]
        #[Min(0.01)]
        #[Max(999999.99)]
        public float $quantity,

        #[Max(1000)]
        public string|Optional|null $notes,

        public string|Optional $created_at,
        public string|Optional $updated_at,
    ) {}

    /**
     * Component product relationship (Lazy loaded)
     *
     * Only included when explicitly requested with ->include('component_product')
     */
    #[Lazy]
    public function component_product(): ProductData|Optional
    {
        if (! $this->resource?->relationLoaded('componentProduct')) {
            return Optional::create();
        }

        return ProductData::from($this->resource->componentProduct);
    }

    /**
     * Kit product relationship (Lazy loaded)
     *
     * Only included when explicitly requested with ->include('kit_product')
     */
    #[Lazy]
    public function kit_product(): ProductData|Optional
    {
        if (! $this->resource?->relationLoaded('kitProduct')) {
            return Optional::create();
        }

        return ProductData::from($this->resource->kitProduct);
    }

    /**
     * Calculate total cost for this component (Computed + Lazy)
     *
     * Only calculated when component_product is loaded
     */
    #[Computed]
    #[Lazy]
    public function total_cost(): float
    {
        $componentProduct = $this->component_product();

        if ($componentProduct instanceof Optional) {
            return 0;
        }

        return $this->quantity * $componentProduct->purchase_price;
    }

    /**
     * Get component unit (Computed + Lazy)
     */
    #[Computed]
    #[Lazy]
    public function unit(): string
    {
        $componentProduct = $this->component_product();

        if ($componentProduct instanceof Optional) {
            return '';
        }

        return $componentProduct->unit;
    }

    /**
     * Calculate total cost for this component (Legacy method for backwards compatibility)
     *
     * @deprecated Use total_cost() computed property instead
     */
    public function calculateCost(): float
    {
        return $this->total_cost();
    }
}
