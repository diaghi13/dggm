<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectWorker;
use App\Enums\ProjectWorkerStatus;
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
