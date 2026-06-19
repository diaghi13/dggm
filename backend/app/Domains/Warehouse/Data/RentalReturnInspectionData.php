<?php

namespace App\Domains\Warehouse\Data;

use App\Domains\Warehouse\Models\RentalReturnInspection;
use App\Enums\InspectionStatus;
use App\Services\InspectionCalculatorService;
use Spatie\LaravelData\Data;

class RentalReturnInspectionData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $ddt_id,
        public readonly ?int $project_id,
        public readonly int $inspected_by_user_id,
        public readonly string $inspection_date,
        public readonly InspectionStatus $status,
        public readonly ?string $overall_notes,

        /** @var RentalReturnInspectionItemData[] */
        public readonly array $items = [],

        // Computed (output only)
        public readonly float $total_damage_value = 0.0,
        public readonly float $total_write_off_value = 0.0,
        public readonly ?string $inspected_by_name = null,
        public readonly ?string $project_name = null,
        public readonly ?string $ddt_code = null,
    ) {}

    public static function fromModel(RentalReturnInspection $inspection): self
    {
        $calculator = app(InspectionCalculatorService::class);
        $items = $inspection->relationLoaded('items') ? $inspection->items : collect();

        return new self(
            id: $inspection->id,
            ddt_id: $inspection->ddt_id,
            project_id: $inspection->project_id,
            inspected_by_user_id: $inspection->inspected_by_user_id,
            inspection_date: $inspection->inspection_date->format('Y-m-d'),
            status: $inspection->status,
            overall_notes: $inspection->overall_notes,
            items: $items->map(fn ($item) => RentalReturnInspectionItemData::fromModel($item))->values()->toArray(),
            total_damage_value: $calculator->calculateTotalDamageValue($items),
            total_write_off_value: $calculator->calculateTotalWriteOffValue($items),
            inspected_by_name: $inspection->relationLoaded('inspectedBy') ? $inspection->inspectedBy?->name : null,
            project_name: $inspection->relationLoaded('project') ? $inspection->project?->name : null,
            ddt_code: $inspection->relationLoaded('ddt') ? $inspection->ddt?->code : null,
        );
    }
}
