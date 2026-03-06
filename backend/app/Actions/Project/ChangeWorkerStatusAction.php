<?php

namespace App\Actions\Project;

use App\Enums\ProjectWorkerStatus;
use App\Models\ProjectWorker;
use Illuminate\Support\Facades\DB;

class ChangeWorkerStatusAction
{
    public function execute(ProjectWorker $projectWorker, ProjectWorkerStatus $status): ProjectWorker
    {
        return DB::transaction(function () use ($projectWorker, $status) {
            $projectWorker->status = $status;
            $projectWorker->save();

            return $projectWorker->fresh(['worker.user', 'project', 'assignedBy']);
        });
    }
}
