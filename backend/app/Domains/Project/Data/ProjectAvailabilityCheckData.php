<?php

namespace App\Domains\Project\Data;

use App\Domains\Project\Models\ProjectAvailabilityCheck;
use App\Enums\AvailabilityCheckStatus;
use Spatie\LaravelData\Data;

class ProjectAvailabilityCheckData extends Data
{
    public function __construct(
        public int $id,
        public int $project_id,
        public AvailabilityCheckStatus $status,
        public string $checked_at,
        public ?int $checked_by_user_id,
        public ?string $notes,
        /** @var ProjectAvailabilityCheckItemData[] */
        public array $items,
        public int $available_count,
        public int $partial_count,
        public int $unavailable_count,
        public int $resolved_count,
    ) {}

    public static function fromModel(ProjectAvailabilityCheck $check): self
    {
        $items = $check->items ?? collect();

        return new self(
            id: $check->id,
            project_id: $check->project_id,
            status: $check->status,
            checked_at: $check->checked_at->toIso8601String(),
            checked_by_user_id: $check->checked_by_user_id,
            notes: $check->notes,
            items: $items->map(fn ($item) => ProjectAvailabilityCheckItemData::fromModel($item))->all(),
            available_count: $items->where('availability_status.value', 'available')->count(),
            partial_count: $items->where('availability_status.value', 'partial')->count(),
            unavailable_count: $items->where('availability_status.value', 'unavailable')->count(),
            resolved_count: $items->where('resolution.value', '!=', 'none')->count(),
        );
    }
}
