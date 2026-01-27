<?php

namespace App\Data;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Enums\ReturnReason;
use App\Models\Ddt;
use App\Models\DdtItem;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * DDT Data Transfer Object
 *
 * Represents a DDT (Documento Di Trasporto) document.
 */
#[TypeScript]
class DdtData extends Data
{
    public function __construct(
        // Primary
        public int|Optional $id,
        public string|Optional $code,

        #[Required, Enum(DdtType::class)]
        public DdtType $type,

        // Context (supplier/customer/site)
        #[Exists('suppliers', 'id')]
        public ?int $supplier_id,

        #[Exists('customers', 'id')]
        public ?int $customer_id,

        #[Exists('sites', 'id')]
        public ?int $site_id,

        // Warehouses
        #[Required, Exists('warehouses', 'id')]
        public int $from_warehouse_id,

        #[Exists('warehouses', 'id')]
        public ?int $to_warehouse_id,

        // Document details
        #[Required, Max(100)]
        public string $ddt_number,

        #[Required]
        public string $ddt_date,

        public ?string $transport_date,
        public ?string $delivered_at,

        // Transport info
        #[Max(255)]
        public ?string $carrier_name,

        #[Max(100)]
        public ?string $tracking_number,

        // Rental specific
        public ?string $rental_start_date,
        public ?string $rental_end_date,
        public ?string $rental_actual_return_date,

        // Return specific
        #[Exists('ddts', 'id')]
        public ?int $parent_ddt_id,

        #[Enum(ReturnReason::class)]
        public ?ReturnReason $return_reason,

        public ?string $return_notes,

        // Status
        #[Enum(DdtStatus::class)]
        public ?DdtStatus $status = DdtStatus::Draft,

        // Notes
        public ?string $notes,

        // Created by
        public ?int $created_by,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,
        public ?string $deleted_at,

        // Lazy relationships
        public Lazy|SupplierData|null $supplier = null,
        public Lazy|CustomerData|null $customer = null, // CustomerData when created
        public Lazy|SiteDate|null $site = null, // SiteData when created
        public Lazy|WarehouseData|null $from_warehouse = null,
        public Lazy|WarehouseData|null $to_warehouse = null,
        public Lazy|UserData|null $created_by_user = null,
        public Lazy|DdtData|null $parent_ddt = null, // DdtData when created

        // Collections
        #[DataCollectionOf(DdtItemData::class)]
        public Lazy|DataCollection $items,

        #[DataCollectionOf(StockMovementData::class)]
        public Lazy|DataCollection|null $stock_movements = null,

        // Computed properties
        #[Computed]
        public int $total_items = 0,

        #[Computed]
        public float $total_quantity = 0,

        #[Computed]
        public bool $can_be_confirmed = false,

        #[Computed]
        public bool $can_be_cancelled = false,

        #[Computed]
        public bool $is_delivered = false,
    ) {}

    /**
     * Create from Ddt model
     */
    public static function fromModel(Ddt $ddt): self
    {
        return new self(
            id: $ddt->id,
            code: $ddt->code,
            type: $ddt->type,
            supplier_id: $ddt->supplier_id,
            customer_id: $ddt->customer_id,
            site_id: $ddt->site_id,
            from_warehouse_id: $ddt->from_warehouse_id,
            to_warehouse_id: $ddt->to_warehouse_id,
            ddt_number: $ddt->ddt_number,
            ddt_date: $ddt->ddt_date->toDateString(),
            transport_date: $ddt->transport_date?->toISOString(),
            delivered_at: $ddt->delivered_at?->toISOString(),
            carrier_name: $ddt->carrier_name,
            tracking_number: $ddt->tracking_number,
            rental_start_date: $ddt->rental_start_date?->toDateString(),
            rental_end_date: $ddt->rental_end_date?->toDateString(),
            rental_actual_return_date: $ddt->rental_actual_return_date?->toDateString(),
            parent_ddt_id: $ddt->parent_ddt_id,
            return_reason: $ddt->return_reason,
            return_notes: $ddt->return_notes,
            status: $ddt->status,
            notes: $ddt->notes,
            created_by: $ddt->created_by,
            created_at: $ddt->created_at->toISOString(),
            updated_at: $ddt->updated_at->toISOString(),
            deleted_at: $ddt->deleted_at?->toISOString(),
            supplier: Lazy::whenLoaded('supplier', $ddt, fn () => SupplierData::from($ddt->supplier)),
            customer: Lazy::whenLoaded('customer', $ddt, fn () => CustomerData::from($ddt->customer)),
            site: Lazy::whenLoaded('site', $ddt, fn () => SiteData::from($ddt->site)),
            from_warehouse: Lazy::whenLoaded('fromWarehouse', $ddt, fn () => WarehouseData::from($ddt->fromWarehouse)),
            to_warehouse: Lazy::whenLoaded('toWarehouse', $ddt, fn () => WarehouseData::from($ddt->toWarehouse)),
            created_by_user: Lazy::whenLoaded('createdBy', $ddt, fn () => UserData::from($ddt->createdBy)),
            parent_ddt: Lazy::whenLoaded('parentDdt', $ddt, fn () => DdtData::from($ddt->parentDdt)),
            items: Lazy::whenLoaded('items', $ddt, fn () => DdtItemData::collect($ddt->items)),
            stock_movements: Lazy::whenLoaded('stockMovements', $ddt, fn () => StockMovementData::collect($ddt->stockMovements)),
            total_items: $ddt->total_items,
            total_quantity: $ddt->total_quantity,
            can_be_confirmed: $ddt->canBeConfirmed(),
            can_be_cancelled: $ddt->canBeCancelled(),
            is_delivered: $ddt->isDelivered(),
        );
    }

    /**
     * Check if DDT can be confirmed
     */
    public function checkCanBeConfirmed(): bool
    {
        return $this->status === DdtStatus::Draft;
    }

    /**
     * Check if DDT can be cancelled
     */
    public function checkCanBeCancelled(): bool
    {
        return $this->status !== DdtStatus::Cancelled && $this->delivered_at === null;
    }

    /**
     * Check if DDT is delivered
     */
    public function checkIsDelivered(): bool
    {
        return $this->delivered_at !== null;
    }

    /**
     * Validation messages
     */
    public static function messages(): array
    {
        return [
            'type.required' => 'Il tipo di DDT è obbligatorio.',
            'from_warehouse_id.required' => 'Il magazzino di partenza è obbligatorio.',
            'from_warehouse_id.exists' => 'Il magazzino di partenza selezionato non esiste.',
            'to_warehouse_id.exists' => 'Il magazzino di destinazione selezionato non esiste.',
            'ddt_number.required' => 'Il numero DDT è obbligatorio.',
            'ddt_number.max' => 'Il numero DDT non può superare i 100 caratteri.',
            'ddt_date.required' => 'La data DDT è obbligatoria.',
            'supplier_id.exists' => 'Il fornitore selezionato non esiste.',
            'customer_id.exists' => 'Il cliente selezionato non esiste.',
            'site_id.exists' => 'Il cantiere selezionato non esiste.',
            'carrier_name.max' => 'Il nome del trasportatore non può superare i 255 caratteri.',
            'tracking_number.max' => 'Il numero di tracciamento non può superare i 100 caratteri.',
            'parent_ddt_id.exists' => 'Il DDT di riferimento selezionato non esiste.',
        ];
    }
}
