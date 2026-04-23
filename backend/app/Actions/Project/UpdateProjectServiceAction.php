<?php

namespace App\Actions\Project;

use App\Data\UpdateProjectServiceData;
use App\Events\ProjectServiceUpdated;
use App\Models\ProjectService;
use Illuminate\Support\Facades\DB;

class UpdateProjectServiceAction
{
    public function execute(ProjectService $service, UpdateProjectServiceData $data): ProjectService
    {
        return DB::transaction(function () use ($service, $data) {
            $service->update(
                array_filter(
                    $data->except('worker_ids')->toArray(),
                    fn ($value) => $value !== null
                )
            );

            if ($data->worker_ids !== null) {
                $service->workers()->sync($data->worker_ids);
            }

            ProjectServiceUpdated::dispatch($service);

            return $service->load('workers');
        });
    }
}
