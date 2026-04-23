<?php

namespace App\Data;

use App\Enums\RepairOrderStatus;
use App\Enums\RepairType;
use App\Models\RepairOrder;
use Spatie\LaravelData\Data;

class RepairOrderData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public int $product_id,
        public int $inventory_id,
        public ?int $incident_id,
        public ?int $inspection_item_id,
        public RepairType $repair_type,
        public ?int $supplier_id,
        public float $quantity,
        public ?string $sent_date,
        public ?string $expected_return_date,
        public ?string $actual_return_date,
        public ?float $repair_cost,
        public ?string $repair_notes,
        public RepairOrderStatus $status,
        public int $created_by_user_id,
        public ?int $resolved_by_user_id,
        public ?string $created_at,
        public ?string $updated_at,

        // Computed (output only)
        public readonly ?string $product_name = null,
        public readonly ?string $product_code = null,
        public readonly ?string $supplier_name = null,
        public readonly ?string $created_by_name = null,
        public readonly bool $is_overdue = false,
    ) {}

    public static function fromModel(RepairOrder $repairOrder): self
    {
        return new self(
            id: $repairOrder->id,
            product_id: $repairOrder->product_id,
            inventory_id: $repairOrder->inventory_id,
            incident_id: $repairOrder->incident_id,
            inspection_item_id: $repairOrder->inspection_item_id,
            repair_type: $repairOrder->repair_type,
            supplier_id: $repairOrder->supplier_id,
            quantity: (float) $repairOrder->quantity,
            sent_date: $repairOrder->sent_date?->format('Y-m-d'),
            expected_return_date: $repairOrder->expected_return_date?->format('Y-m-d'),
            actual_return_date: $repairOrder->actual_return_date?->format('Y-m-d'),
            repair_cost: $repairOrder->repair_cost !== null ? (float) $repairOrder->repair_cost : null,
            repair_notes: $repairOrder->repair_notes,
            status: $repairOrder->status,
            created_by_user_id: $repairOrder->created_by_user_id,
            resolved_by_user_id: $repairOrder->resolved_by_user_id,
            created_at: $repairOrder->created_at?->toIso8601String(),
            updated_at: $repairOrder->updated_at?->toIso8601String(),
            product_name: $repairOrder->relationLoaded('product') ? $repairOrder->product?->name : null,
            product_code: $repairOrder->relationLoaded('product') ? $repairOrder->product?->code : null,
            supplier_name: $repairOrder->relationLoaded('supplier') ? $repairOrder->supplier?->name : null,
            created_by_name: $repairOrder->relationLoaded('createdBy') ? $repairOrder->createdBy?->name : null,
            is_overdue: $repairOrder->isOverdue(),
        );
    }
}
