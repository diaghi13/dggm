<?php

namespace App\Actions\Project;

use App\Models\ProjectWorker;
use App\Models\WorkerInvitation;

class ResendWorkerInviteAction
{
    public function execute(ProjectWorker $projectWorker): void
    {
        $worker = $projectWorker->worker;
        $user = $worker?->user;

        if ($user) {
            // Worker already has an account → resend assignment notification
            app(NotifyWorkerAssignmentAction::class)->execute($projectWorker, $user);

            return;
        }

        // Worker has no account yet — find their pending invitation and resend
        if ($worker?->email) {
            $invitation = WorkerInvitation::where('email', $worker->email)
                ->whereNull('accepted_at')
                ->latest()
                ->first();

            if ($invitation) {
                app(SendProjectInvitationEmailAction::class)->execute($invitation, $projectWorker);
            }
        }
    }
}
