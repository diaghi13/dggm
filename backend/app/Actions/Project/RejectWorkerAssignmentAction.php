<?php

namespace App\Actions\Project;

use App\Enums\ProjectWorkerStatus;
use App\Models\ProjectWorker;
use Illuminate\Support\Facades\DB;

class RejectWorkerAssignmentAction
{
    public function execute(ProjectWorker $projectWorker, ?string $rejectionReason = null): ProjectWorker
    {
        return DB::transaction(function () use ($projectWorker, $rejectionReason) {
            $projectWorker->status = ProjectWorkerStatus::Rejected;
            $projectWorker->responded_at = now();
            $projectWorker->rejection_reason = $rejectionReason;
            $projectWorker->save();

            return $projectWorker->fresh(['worker.user', 'project', 'assignedBy']);
        });
    }
}
