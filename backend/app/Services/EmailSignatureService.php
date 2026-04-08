<?php

namespace App\Services;

use App\Models\EmailAccount;
use App\Models\Setting;

class EmailSignatureService
{
    public function __construct(
        private readonly SettingService $settings
    ) {}

    /**
     * Resolve the email signature with a three-level cascade:
     * 1. Specific EmailAccount signature
     * 2. User-specific global signature setting
     * 3. Global tenant signature setting
     *
     * Returns the raw HTML — image embedding is handled at send-time
     * via CID inline attachments (see InlineImageProcessor).
     */
    public function resolve(?int $emailAccountId = null, ?int $userId = null): ?string
    {
        if ($emailAccountId) {
            $account = EmailAccount::find($emailAccountId);
            if ($account?->signature) {
                return $account->signature;
            }
        }

        if ($userId) {
            $userSignature = Setting::where('key', 'email.signature')
                ->where('user_id', $userId)
                ->value('value');
            if ($userSignature) {
                return $userSignature;
            }
        }

        $global = $this->settings->get('email.signature');

        return $global ?: null;
    }
}
