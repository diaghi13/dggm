<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectWorker;
use App\Enums\DocumentType;
use App\Mail\WorkerAssignedToProjectMail;
use App\Models\EmailAccount;
use App\Models\User;
use App\Notifications\WorkerAssignedToProject;
use App\Services\TenantMailService;
use Illuminate\Support\Facades\Log;

class NotifyWorkerAssignmentAction
{
    public function __construct(
        private readonly TenantMailService $mailService
    ) {}

    public function execute(ProjectWorker $projectWorker, User $user): void
    {
        // Always store the database notification
        $user->notify(new WorkerAssignedToProject($projectWorker));

        // Send email via tenant mail account if one is configured
        $emailAccount = EmailAccount::active()->default()->first();

        Log::info('NotifyWorkerAssignmentAction: checking for email account', [
            'project_worker_id' => $projectWorker->id,
            'user_id' => $user->id,
            'email_account_found' => (bool) $emailAccount,
        ]);

        if ($emailAccount) {
            try {
                $mailable = new WorkerAssignedToProjectMail($projectWorker);

                $this->mailService->sendWithAccount(
                    $emailAccount,
                    $mailable,
                    $user->email,
                    $user->name,
                    DocumentType::Generic,
                    $projectWorker->id,
                );
            } catch (\Throwable $e) {
                Log::warning('TenantMailService failed for worker assignment notification', [
                    'error' => $e->getMessage(),
                    'project_worker_id' => $projectWorker->id,
                    'user_id' => $user->id,
                ]);
                // Database notification already sent above; email failure is non-fatal
            }
        }
    }
}
