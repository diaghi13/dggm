<?php

namespace App\Actions\Project;

use App\Events\ProjectCreated;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class CreateProjectAction
{
    public function execute(array $data): Project
    {
        return DB::transaction(function () use ($data) {
            $project = Project::create($data);

            ProjectCreated::dispatch($project, ['user_id' => auth()->id()]);

            return $project;
        });
    }
}
