<?php

namespace App\Queries\Project;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectAvailabilityCheck;

class GetProjectAvailabilityCheckQuery
{
    public function __construct(private readonly Project $project) {}

    /**
     * Returns the latest availability check for the project with all items and relations.
     */
    public function execute(): ?ProjectAvailabilityCheck
    {
        return ProjectAvailabilityCheck::where('project_id', $this->project->id)
            ->with(['items.projectMaterial.product', 'items.subrentalSupplier', 'checkedBy'])
            ->latest('checked_at')
            ->first();
    }
}
