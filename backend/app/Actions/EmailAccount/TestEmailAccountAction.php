<?php

namespace App\Actions\EmailAccount;

use App\Mail\TestMail;
use App\Models\EmailAccount;
use App\Services\TenantMailService;

class TestEmailAccountAction
{
    public function __construct(
        private readonly TenantMailService $tenantMailService
    ) {}

    public function execute(EmailAccount $account): array
    {
        try {
            $toEmail = auth()->user()?->email ?? $account->from_email;

            $this->tenantMailService->buildMailer($account)
                ->to($toEmail)
                ->send(new TestMail($account));

            $account->update([
                'last_tested_at' => now(),
                'last_test_success' => true,
                'last_test_error' => null,
            ]);

            return ['success' => true, 'message' => "Email di test inviata a {$toEmail}."];
        } catch (\Throwable $e) {
            $account->update([
                'last_tested_at' => now(),
                'last_test_success' => false,
                'last_test_error' => $e->getMessage(),
            ]);

            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
