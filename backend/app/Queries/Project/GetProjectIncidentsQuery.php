<?php

namespace App\Queries\Project;

use App\Models\Project;
use App\Models\ProjectMaterialIncident;
use Illuminate\Database\Eloquent\Collection;

class GetProjectIncidentsQuery
{
    public function __construct(
        private readonly Project $project,
        private readonly array $filters = []
    ) {}

    public function execute(): Collection
    {
        return ProjectMaterialIncident::where('project_id', $this->project->id)
            ->when($this->filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($this->filters['incident_type'] ?? null, fn ($q, $v) => $q->where('incident_type', $v))
            ->when(
                array_key_exists('is_chargeable_to_client', $this->filters),
                fn ($q) => $q->where('is_chargeable_to_client', $this->filters['is_chargeable_to_client'])
            )
            ->with(['projectMaterial.product', 'reportedBy:id,name', 'resolvedBy:id,name'])
            ->orderByDesc('incident_date')
            ->get();
    }
}
