<?php

namespace App\Data;

use App\Enums\StockMovementType;
use App\Models\StockMovement;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * Stock Movement Data Transfer Object
 *
 * Represents stock movements (intake, output, transfer, adjustment, etc.).
 */
#[TypeScript]
class StockMovementData extends Data
{
    public function __construct(
        // Primary
        public int|Optional $id,
        public string|Optional $code,

        // DDT reference
        public ?int $ddt_id,

        // Product and warehouse
        #[Required, Exists('products', 'id')]
        public int $product_id,

        #[Required, Exists('warehouses', 'id')]
        public int $warehouse_id,

        // Movement details
        #[Required, Enum(StockMovementType::class)]
        public StockMovementType $type,

        #[Required, Min(0.01)]
        public float $quantity,

        #[Min(0)]
        public ?float $unit_cost,

        #[Required]
        public string $movement_date,

        // Transfer specific
        #[Exists('warehouses', 'id')]
        public ?int $from_warehouse_id,

        #[Exists('warehouses', 'id')]
        public ?int $to_warehouse_id,

        // Site allocation specific
        #[Exists('sites', 'id')]
        public ?int $site_id,

        // Supplier intake specific
        #[Exists('suppliers', 'id')]
        public ?int $supplier_id,

        public ?string $supplier_document,

        // Tracking
        public ?int $user_id,
        public ?string $notes,
        public ?string $reference_document,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,

        // Lazy relationships
        public Lazy|ProductData|null $product = null,
        public Lazy|WarehouseData|null $warehouse = null,
        public Lazy|WarehouseData|null $from_warehouse = null,
        public Lazy|WarehouseData|null $to_warehouse = null,
        public Lazy|null $site = null, // SiteData when created
        public Lazy|SupplierData|null $supplier = null,
        public Lazy|UserData|null $user = null,
        public Lazy|null $ddt = null, // DdtData when created

        // Computed properties
        #[Computed]
        public float $total_value = 0,

        #[Computed]
        public string $type_label = '',

        #[Computed]
        public string $type_color = '',

        #[Computed]
        public bool $is_outgoing = false,

        #[Computed]
        public bool $is_incoming = false,
    ) {}

    /**
     * Create from StockMovement model
     */
    public static function fromModel(StockMovement $movement): self
    {
        return new self(
            id: $movement->id,
            code: $movement->code,
            ddt_id: $movement->ddt_id,
            product_id: $movement->product_id,
            warehouse_id: $movement->warehouse_id,
            type: $movement->type,
            quantity: $movement->quantity,
            unit_cost: $movement->unit_cost,
            movement_date: $movement->movement_date->toDateString(),
            from_warehouse_id: $movement->from_warehouse_id,
            to_warehouse_id: $movement->to_warehouse_id,
            site_id: $movement->site_id,
            supplier_id: $movement->supplier_id,
            supplier_document: $movement->supplier_document,
            user_id: $movement->user_id,
            notes: $movement->notes,
            reference_document: $movement->reference_document,
            created_at: $movement->created_at->toISOString(),
            updated_at: $movement->updated_at->toISOString(),
            product: Lazy::whenLoaded('product', $movement, fn () => ProductData::from($movement->product)),
            warehouse: Lazy::whenLoaded('warehouse', $movement, fn () => WarehouseData::from($movement->warehouse)),
            from_warehouse: Lazy::whenLoaded('fromWarehouse', $movement, fn () => WarehouseData::from($movement->fromWarehouse)),
            to_warehouse: Lazy::whenLoaded('toWarehouse', $movement, fn () => WarehouseData::from($movement->toWarehouse)),
            // site: Lazy::whenLoaded('site', $movement, fn () => SiteData::from($movement->site)),
            supplier: Lazy::whenLoaded('supplier', $movement, fn () => SupplierData::from($movement->supplier)),
            user: Lazy::whenLoaded('user', $movement, fn () => UserData::from($movement->user)),
            // ddt: Lazy::whenLoaded('ddt', $movement, fn () => DdtData::from($movement->ddt)),
            total_value: $movement->total_value,
            type_label: $movement->type->label(),
            type_color: $movement->type->color(),
            is_outgoing: $movement->type->isOutgoing(),
            is_incoming: $movement->type->isIncoming(),
        );
    }

    /**
     * Calculate total value
     */
    public function calculateTotalValue(): float
    {
        return $this->quantity * ($this->unit_cost ?? 0);
    }

    /**
     * Get type label
     */
    public function getTypeLabel(): string
    {
        return $this->type->label();
    }

    /**
     * Get type color
     */
    public function getTypeColor(): string
    {
        return $this->type->color();
    }

    /**
     * Check if movement is outgoing
     */
    public function checkIsOutgoing(): bool
    {
        return $this->type->isOutgoing();
    }

    /**
     * Check if movement is incoming
     */
    public function checkIsIncoming(): bool
    {
        return $this->type->isIncoming();
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
            'type.required' => 'Il tipo di movimento è obbligatorio.',
            'quantity.required' => 'La quantità è obbligatoria.',
            'quantity.min' => 'La quantità deve essere maggiore di zero.',
            'unit_cost.min' => 'Il costo unitario non può essere negativo.',
            'movement_date.required' => 'La data del movimento è obbligatoria.',
            'from_warehouse_id.exists' => 'Il magazzino di provenienza selezionato non esiste.',
            'to_warehouse_id.exists' => 'Il magazzino di destinazione selezionato non esiste.',
            'site_id.exists' => 'Il cantiere selezionato non esiste.',
            'supplier_id.exists' => 'Il fornitore selezionato non esiste.',
        ];
    }
}
