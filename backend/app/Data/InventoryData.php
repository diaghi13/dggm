<?php

namespace App\Data;

use App\Models\Inventory;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * Inventory Data Transfer Object
 *
 * Represents inventory records for products in warehouses.
 */
#[TypeScript]
class InventoryData extends Data
{
    public function __construct(
        // Primary
        public int|Optional $id,

        #[Required, Exists('products', 'id')]
        public int $product_id,

        #[Required, Exists('warehouses', 'id')]
        public int $warehouse_id,

        // Quantities
        #[Min(0)]
        public ?float $quantity_available = 0,

        #[Min(0)]
        public ?float $quantity_reserved = 0,

        #[Min(0)]
        public ?float $quantity_in_transit = 0,

        #[Min(0)]
        public ?float $quantity_quarantine = 0,

        // Stock levels
        #[Min(0)]
        public ?float $minimum_stock,

        #[Min(0)]
        public ?float $maximum_stock,

        public ?string $last_count_date,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,

        // Lazy relationships
        public Lazy|ProductData|null $product = null,
        public Lazy|WarehouseData|null $warehouse = null,

        // Computed properties
        #[Computed]
        public float $quantity_free = 0,

        #[Computed]
        public bool $is_low_stock = false,

        #[Computed]
        public float $stock_value = 0,
    ) {}

    /**
     * Create from Inventory model
     */
    public static function fromModel(Inventory $inventory): self
    {
        return new self(
            id: $inventory->id,
            product_id: $inventory->product_id,
            warehouse_id: $inventory->warehouse_id,
            quantity_available: $inventory->quantity_available,
            quantity_reserved: $inventory->quantity_reserved,
            quantity_in_transit: $inventory->quantity_in_transit,
            quantity_quarantine: $inventory->quantity_quarantine,
            minimum_stock: $inventory->minimum_stock,
            maximum_stock: $inventory->maximum_stock,
            last_count_date: $inventory->last_count_date?->toDateString(),
            created_at: $inventory->created_at->toISOString(),
            updated_at: $inventory->updated_at->toISOString(),
            product: Lazy::whenLoaded('product', $inventory, fn () => ProductData::from($inventory->product)),
            warehouse: Lazy::whenLoaded('warehouse', $inventory, fn () => WarehouseData::from($inventory->warehouse)),
            quantity_free: $inventory->quantity_free,
            is_low_stock: $inventory->is_low_stock,
            stock_value: $inventory->stock_value,
        );
    }

    /**
     * Calculate free quantity
     */
    public function calculateQuantityFree(): float
    {
        return max(0, $this->quantity_available - $this->quantity_reserved);
    }

    /**
     * Check if stock is low
     */
    public function checkIsLowStock(): bool
    {
        if ($this->minimum_stock === null) {
            return false;
        }

        return $this->quantity_available <= $this->minimum_stock;
    }

    /**
     * Calculate stock value (requires product relationship)
     */
    public function calculateStockValue(?float $productCost = null): float
    {
        if ($productCost === null && $this->product instanceof ProductData) {
            $productCost = $this->product->standard_cost;
        }

        return $this->quantity_available * ($productCost ?? 0);
    }

    /**
     * Validation messages
     */
    public static function messages(): array
    {
        return [
            'product_id.required' => 'Il prodotto è obbligatorio.',
            'product_id.exists' => 'Il prodotto selezionato non esiste.',
            'warehouse_id.required' => 'Il magazzino è obbligatorio.',
            'warehouse_id.exists' => 'Il magazzino selezionato non esiste.',
            'quantity_available.min' => 'La quantità disponibile non può essere negativa.',
            'quantity_reserved.min' => 'La quantità riservata non può essere negativa.',
            'quantity_in_transit.min' => 'La quantità in transito non può essere negativa.',
            'quantity_quarantine.min' => 'La quantità in quarantena non può essere negativa.',
            'minimum_stock.min' => 'La scorta minima non può essere negativa.',
            'maximum_stock.min' => 'La scorta massima non può essere negativa.',
        ];
    }
}
