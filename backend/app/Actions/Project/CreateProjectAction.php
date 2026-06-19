<?php

namespace App\Actions\Project;

use App\Domains\Project\Data\ProjectData;
use App\Domains\Project\Models\Project;
use App\Events\ProjectCreated;
use Illuminate\Support\Facades\DB;

class CreateProjectAction
{
    public function execute(ProjectData $data): Project
    {
        return DB::transaction(function () use ($data) {
            $project = Project::create($data->except('id', 'customer')->toArray());

            ProjectCreated::dispatch($project, ['user_id' => auth()->id()]);

            return $project;
        });
    }
}
