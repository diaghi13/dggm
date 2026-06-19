<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectWorker;
use App\Enums\ProjectWorkerStatus;
use App\Notifications\AssignmentRespondedByWorker;
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

            $fresh = $projectWorker->fresh(['worker.user', 'project.customer', 'assignedBy']);

            // Notify the project manager (assigned-by user) of the rejection
            if ($fresh->assignedBy) {
                $fresh->assignedBy->notify(new AssignmentRespondedByWorker(
                    projectWorker: $fresh,
                    wasAccepted: false,
                    reason: $rejectionReason
                ));
            }

            return $fresh;
        });
    }
}
