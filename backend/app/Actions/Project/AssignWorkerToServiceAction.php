<?php

namespace App\Actions\Project;

use App\Data\AssignWorkerToServiceData;
use App\Events\ProjectServiceUpdated;
use App\Models\ProjectService;
use Illuminate\Support\Facades\DB;

class AssignWorkerToServiceAction
{
    public function execute(ProjectService $service, AssignWorkerToServiceData $data): ProjectService
    {
        DB::transaction(function () use ($service, $data) {
            $service->workers()->syncWithoutDetaching([
                $data->project_worker_id => [
                    'assigned_hours' => $data->assigned_hours,
                    'notes' => $data->notes,
                ],
            ]);
            ProjectServiceUpdated::dispatch($service);
        });

        return $service->load('workers');
    }
}
