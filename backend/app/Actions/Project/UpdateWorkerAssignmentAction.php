<?php

namespace App\Actions\Project;

use App\Models\ProjectWorker;
use Illuminate\Support\Facades\DB;

class UpdateWorkerAssignmentAction
{
    public function execute(ProjectWorker $projectWorker, array $data): ProjectWorker
    {
        return DB::transaction(function () use ($projectWorker, $data) {
            $projectWorker->update($data);

            return $projectWorker->fresh(['worker.user', 'project', 'assignedBy']);
        });
    }
}
