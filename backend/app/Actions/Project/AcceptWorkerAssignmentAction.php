<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectWorker;
use App\Enums\ProjectWorkerStatus;
use App\Notifications\AssignmentRespondedByWorker;
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

            $fresh = $projectWorker->fresh(['worker.user', 'project.customer', 'assignedBy']);

            // Notify the project manager (assigned-by user) of the acceptance
            if ($fresh->assignedBy) {
                $fresh->assignedBy->notify(new AssignmentRespondedByWorker(
                    projectWorker: $fresh,
                    wasAccepted: true,
                    reason: $notes
                ));
            }

            return $fresh;
        });
    }
}
