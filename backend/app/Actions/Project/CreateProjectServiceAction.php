<?php

namespace App\Actions\Project;

use App\Data\CreateProjectServiceData;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectService;
use App\Events\ProjectServiceCreated;
use Illuminate\Support\Facades\DB;

class CreateProjectServiceAction
{
    public function execute(Project $project, CreateProjectServiceData $data): ProjectService
    {
        return DB::transaction(function () use ($project, $data) {
            $service = ProjectService::create([
                ...$data->except('worker_ids')->toArray(),
                'project_id' => $project->id,
                'created_by_user_id' => auth()->id(),
            ]);

            if ($data->worker_ids) {
                $service->workers()->sync($data->worker_ids);
            }

            ProjectServiceCreated::dispatch($service);

            return $service->load('workers');
        });
    }
}
