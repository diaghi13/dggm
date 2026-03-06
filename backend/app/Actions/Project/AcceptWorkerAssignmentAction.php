<?php

namespace App\Actions\Project;

use App\Enums\ProjectWorkerStatus;
use App\Models\ProjectWorker;
use Illuminate\Support\Facades\DB;

class AcceptWorkerAssignmentAction
{
    public function execute(ProjectWorker $projectWorker, ?string $notes = null): ProjectWorker
    {
        return DB::transaction(function () use ($projectWorker, $notes) {
            $projectWorker->status = ProjectWorkerStatus::Accepted;
            $projectWorker->responded_at = now();

            if ($notes !== null) {
                $projectWorker->notes = $notes;
            }

            $projectWorker->save();

            return $projectWorker->fresh(['worker.user', 'project', 'assignedBy']);
        });
    }
}
