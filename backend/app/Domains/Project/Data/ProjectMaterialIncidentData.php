<?php

namespace App\Domains\Project\Data;

use App\Domains\Project\Models\ProjectMaterialIncident;
use App\Enums\DamageSeverity;
use App\Enums\IncidentStatus;
use App\Enums\IncidentType;
use Spatie\LaravelData\Data;

class ProjectMaterialIncidentData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public int $project_id,
        public int $project_material_id,
        public IncidentType $incident_type,
        public ?DamageSeverity $damage_severity,
        public string $description,
        public string $incident_date,
        public bool $is_chargeable_to_client,
        public ?float $charge_amount,
        public ?string $charge_basis,
        public IncidentStatus $status,
        public ?string $resolution_notes,
        public ?int $reported_by_user_id,
        public ?int $resolved_by_user_id,
        public ?string $resolved_at,
        public ?int $ddt_item_id,

        // Computed (output only)
        public readonly ?string $product_name = null,
        public readonly ?string $reported_by_name = null,
        public readonly ?string $resolved_by_name = null,
        public readonly int $incident_photos_count = 0,
    ) {}

    public static function fromModel(ProjectMaterialIncident $incident): self
    {
        return new self(
            id: $incident->id,
            project_id: $incident->project_id,
            project_material_id: $incident->project_material_id,
            incident_type: $incident->incident_type,
            damage_severity: $incident->damage_severity,
            description: $incident->description,
            incident_date: $incident->incident_date->format('Y-m-d'),
            is_chargeable_to_client: $incident->is_chargeable_to_client,
            charge_amount: $incident->charge_amount !== null ? (float) $incident->charge_amount : null,
            charge_basis: $incident->charge_basis,
            status: $incident->status,
            resolution_notes: $incident->resolution_notes,
            reported_by_user_id: $incident->reported_by_user_id,
            resolved_by_user_id: $incident->resolved_by_user_id,
            resolved_at: $incident->resolved_at?->toIso8601String(),
            ddt_item_id: $incident->ddt_item_id,
            product_name: $incident->relationLoaded('projectMaterial') && $incident->projectMaterial?->relationLoaded('product')
                ? $incident->projectMaterial->product?->name
                : null,
            reported_by_name: $incident->relationLoaded('reportedBy') ? $incident->reportedBy?->name : null,
            resolved_by_name: $incident->relationLoaded('resolvedBy') ? $incident->resolvedBy?->name : null,
            incident_photos_count: $incident->getMedia('incident_photos')->count(),
        );
    }
}
