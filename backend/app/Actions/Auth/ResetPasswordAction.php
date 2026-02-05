<?php

namespace App\Actions\Auth;

use App\Data\ResetPasswordData;
use App\Events\PasswordReset;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class ResetPasswordAction
{
    public function execute(ResetPasswordData $data): string
    {
        // Use Laravel's built-in password broker to reset password
        $status = Password::reset(
            [
                'email' => $data->email,
                'password' => $data->password,
                'password_confirmation' => $data->password_confirmation,
                'token' => $data->token,
            ],
            function (User $user, string $password) {
                $user->password = Hash::make($password);
                $user->save();

                // Revoke all existing tokens for security
                $user->tokens()->delete();

                // Dispatch event for logging/audit
                PasswordReset::dispatch($user, [
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            }
        );

        return $status;
    }
}
