<?php

namespace App\Actions\Auth;

use App\Data\ForgotPasswordData;
use App\Events\PasswordResetRequested;
use Illuminate\Support\Facades\Password;

class SendPasswordResetLinkAction
{
    public function execute(ForgotPasswordData $data): string
    {
        $status = Password::broker('global_users')->sendResetLink(
            ['email' => $data->email]
        );

        if ($status === Password::RESET_LINK_SENT) {
            PasswordResetRequested::dispatch($data->email, [
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return $status;
    }
}
