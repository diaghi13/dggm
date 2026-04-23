<?php

namespace App\Data;

use App\Enums\InspectionItemAction;
use App\Enums\ItemCondition;
use App\Models\RentalReturnInspectionItem;
use Spatie\LaravelData\Data;

class RentalReturnInspectionItemData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $inspection_id,
        public readonly int $ddt_item_id,
        public readonly int $product_id,
        public readonly float $total_quantity,
        public readonly float $quantity_good,
        public readonly float $quantity_damaged,
        public readonly float $quantity_write_off,
        public readonly ?ItemCondition $condition,
        public readonly ?string $damage_description,
        public readonly ?float $repair_estimate,
        public readonly ?InspectionItemAction $action,
        public readonly ?int $incident_id,
        public readonly ?int $warehouse_id,

        // Computed (output only)
        public readonly ?string $product_name = null,
        public readonly ?string $product_code = null,
        public readonly ?string $warehouse_name = null,
        public readonly bool $is_reviewed = false,
    ) {}

    public static function fromModel(RentalReturnInspectionItem $item): self
    {
        return new self(
            id: $item->id,
            inspection_id: $item->inspection_id,
            ddt_item_id: $item->ddt_item_id,
            product_id: $item->product_id,
            total_quantity: (float) $item->total_quantity,
            quantity_good: (float) $item->quantity_good,
            quantity_damaged: (float) $item->quantity_damaged,
            quantity_write_off: (float) $item->quantity_write_off,
            condition: $item->condition,
            damage_description: $item->damage_description,
            repair_estimate: $item->repair_estimate !== null ? (float) $item->repair_estimate : null,
            action: $item->action,
            incident_id: $item->incident_id,
            warehouse_id: $item->warehouse_id,
            product_name: $item->relationLoaded('product') ? $item->product?->name : null,
            product_code: $item->relationLoaded('product') ? $item->product?->code : null,
            warehouse_name: $item->relationLoaded('warehouse') ? $item->warehouse?->name : null,
            is_reviewed: $item->isReviewed(),
        );
    }
}
