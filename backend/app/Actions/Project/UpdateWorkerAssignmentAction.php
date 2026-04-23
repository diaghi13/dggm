<?php

namespace App\Actions\Project;

use App\Models\ProjectWorker;
use Illuminate\Support\Facades\DB;

class UpdateWorkerAssignmentAction
{
    public function execute(ProjectWorker $projectWorker, array $data): ProjectWorker
    {
        return DB::transaction(function () use ($projectWorker, $data) {
            $filteredData = collect($data)->except('role_ids')->toArray();
            $projectWorker->update($filteredData);

            if (isset($data['role_ids'])) {
                $projectWorker->roles()->sync($data['role_ids']);
            }

            return $projectWorker->fresh(['worker.user', 'project', 'assignedBy', 'roles']);
        });
    }
}
