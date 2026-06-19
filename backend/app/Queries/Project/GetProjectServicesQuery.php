<?php

namespace App\Queries\Project;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectService;
use Illuminate\Database\Eloquent\Collection;

class GetProjectServicesQuery
{
    public function __construct(private readonly Project $project) {}

    public function execute(): Collection
    {
        return ProjectService::where('project_id', $this->project->id)
            ->with(['workers.worker', 'createdBy:id,name'])
            ->orderBy('status')
            ->orderBy('created_at')
            ->get();
    }
}
