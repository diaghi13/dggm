<?php

namespace App\Actions\Auth;

use App\Data\ForgotPasswordData;
use App\Events\PasswordResetRequested;
use Illuminate\Support\Facades\Password;

class SendPasswordResetLinkAction
{
    public function execute(ForgotPasswordData $data): string
    {
        // Use Laravel's built-in password broker to send reset link
        $status = Password::sendResetLink(
            ['email' => $data->email]
        );

        if ($status === Password::RESET_LINK_SENT) {
            // Dispatch event for logging/audit
            PasswordResetRequested::dispatch($data->email, [
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return $status;
    }
}
