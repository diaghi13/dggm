<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectWorker;
use App\Enums\DocumentType;
use App\Mail\WorkerProjectInvitationMail;
use App\Models\EmailAccount;
use App\Models\WorkerInvitation;
use App\Services\InvitationService;
use App\Services\TenantMailService;
use Illuminate\Support\Facades\Log;

class SendProjectInvitationEmailAction
{
    public function __construct(
        private readonly TenantMailService $mailService,
        private readonly InvitationService $invitationService,
    ) {}

    public function execute(WorkerInvitation $invitation, ProjectWorker $projectWorker): void
    {
        $emailAccount = EmailAccount::active()->default()->first();

        if ($emailAccount) {
            try {
                $mailable = new WorkerProjectInvitationMail($invitation, $projectWorker);

                $this->mailService->sendWithAccount(
                    $emailAccount,
                    $mailable,
                    $invitation->email,
                    trim($invitation->first_name.' '.$invitation->last_name),
                    DocumentType::Invitation,
                    $invitation->id,
                );

                return;
            } catch (\Throwable $e) {
                Log::warning('TenantMailService failed for project invitation email', [
                    'error' => $e->getMessage(),
                    'invitation_id' => $invitation->id,
                    'project_worker_id' => $projectWorker->id,
                ]);
            }
        }

        // Fallback: use standard invitation notification (no project context)
        $this->invitationService->sendInvitation($invitation);
    }
}
