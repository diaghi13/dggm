<?php

namespace App\Data;

use App\Enums\AvailabilityResolution;
use App\Enums\AvailabilityStatus;
use App\Models\ProjectAvailabilityCheckItem;
use Spatie\LaravelData\Data;

class ProjectAvailabilityCheckItemData extends Data
{
    public function __construct(
        public int $id,
        public int $check_id,
        public int $project_material_id,
        public float $planned_qty,
        public float $available_qty,
        public float $reserved_qty,
        public float $shortage_qty,
        public AvailabilityStatus $availability_status,
        public AvailabilityResolution $resolution,
        public ?int $subrental_supplier_id,
        public ?float $subrental_estimated_cost,
        public ?string $resolved_at,
        public ?int $resolved_by_user_id,
        public ?string $product_name,
        public ?string $product_code,
        public ?string $unit,
    ) {}

    public static function fromModel(ProjectAvailabilityCheckItem $item): self
    {
        return new self(
            id: $item->id,
            check_id: $item->check_id,
            project_material_id: $item->project_material_id,
            planned_qty: (float) $item->planned_qty,
            available_qty: (float) $item->available_qty,
            reserved_qty: (float) $item->reserved_qty,
            shortage_qty: (float) $item->shortage_qty,
            availability_status: $item->availability_status,
            resolution: $item->resolution,
            subrental_supplier_id: $item->subrental_supplier_id,
            subrental_estimated_cost: $item->subrental_estimated_cost ? (float) $item->subrental_estimated_cost : null,
            resolved_at: $item->resolved_at?->toIso8601String(),
            resolved_by_user_id: $item->resolved_by_user_id,
            product_name: $item->projectMaterial?->product?->name ?? $item->projectMaterial?->notes,
            product_code: $item->projectMaterial?->product?->code,
            unit: $item->projectMaterial?->product?->unit,
        );
    }
}
