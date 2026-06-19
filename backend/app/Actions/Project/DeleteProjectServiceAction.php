<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectService;
use App\Events\ProjectServiceDeleted;
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
