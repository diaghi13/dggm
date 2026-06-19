<?php

namespace App\Queries\Project;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectAvailabilityCheck;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetProjectAvailabilityChecksQuery
{
    public function __construct(
        private readonly Project $project,
        private readonly int $perPage = 15,
    ) {}

    /**
     * Returns a paginated list of availability checks for the project.
     */
    public function execute(): LengthAwarePaginator
    {
        return ProjectAvailabilityCheck::where('project_id', $this->project->id)
            ->with(['checkedBy', 'items'])
            ->latest('checked_at')
            ->paginate($this->perPage);
    }
}
