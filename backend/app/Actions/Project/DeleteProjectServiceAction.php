<?php

namespace App\Actions\Project;

use App\Events\ProjectServiceDeleted;
use App\Models\ProjectService;
use Illuminate\Support\Facades\DB;

class DeleteProjectServiceAction
{
    public function execute(ProjectService $service): void
    {
        DB::transaction(function () use ($service) {
            $service->delete();
            ProjectServiceDeleted::dispatch($service);
        });
    }
}
