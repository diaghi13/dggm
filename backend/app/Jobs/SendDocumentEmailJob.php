<?php

namespace App\Jobs;

use App\Mail\GenericMail;
use App\Models\EmailAccount;
use App\Models\EmailLog;
use App\Services\TenantMailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendDocumentEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 4;

    public int $timeout = 60;

    public function backoff(): array
    {
        return [60, 300, 900]; // 1min, 5min, 15min
    }

    public function __construct(
        public readonly int $emailLogId,
        public readonly int $emailAccountId,
        public readonly string $toEmail,
        public readonly ?string $toName,
        public readonly string $subject,
        public readonly string $bodyHtml,
    ) {}

    public function handle(TenantMailService $tenantMailService): void
    {
        $account = EmailAccount::findOrFail($this->emailAccountId);
        $log = EmailLog::findOrFail($this->emailLogId);

        $log->increment('attempts');
        $log->update(['status' => 'retrying']);

        try {
            $mailer = $tenantMailService->buildMailer($account);
            $mailer->to($this->toEmail, $this->toName)
                ->send(new GenericMail(
                    subject: $this->subject,
                    bodyHtml: $this->bodyHtml,
                ));

            $log->update([
                'status' => 'sent',
                'sent_at' => now(),
                'last_error' => null,
            ]);
        } catch (\Throwable $e) {
            $isPermanent = $this->isPermanentError($e);

            if ($isPermanent) {
                $log->update([
                    'status' => 'failed',
                    'failed_at' => now(),
                    'last_error' => $e->getMessage(),
                ]);
                $this->fail($e);

                return;
            }

            $log->update(['last_error' => $e->getMessage()]);
            throw $e; // triggers retry
        }
    }

    public function failed(\Throwable $exception): void
    {
        EmailLog::find($this->emailLogId)?->update([
            'status' => 'failed',
            'failed_at' => now(),
            'last_error' => $exception->getMessage(),
        ]);
    }

    private function isPermanentError(\Throwable $e): bool
    {
        $message = strtolower($e->getMessage());
        $permanentPatterns = [
            '535', 'authentication', 'invalid credentials',
            '550', 'user unknown', 'mailbox not found',
            '553', 'invalid address',
        ];

        foreach ($permanentPatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return true;
            }
        }

        return false;
    }
}
