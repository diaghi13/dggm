<?php

namespace App\Actions\Project;

use App\Data\ProjectData;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class UpdateProjectAction
{
    public function execute(Project $project, ProjectData $data): Project
    {
        return DB::transaction(function () use ($project, $data) {
            $project->update($data->except('id', 'customer')->toArray());

            return $project->fresh();
        });
    }
}
