<?php

namespace App\Actions\Auth;

use App\Data\ResetPasswordData;
use App\Events\GlobalUserUpdated;
use App\Models\Landlord\GlobalUser;
use Illuminate\Support\Facades\Password;

class ResetPasswordAction
{
    public function execute(ResetPasswordData $data): string
    {
        return Password::broker('global_users')->reset(
            [
                'email' => $data->email,
                'password' => $data->password,
                'password_confirmation' => $data->password_confirmation,
                'token' => $data->token,
            ],
            function (GlobalUser $globalUser, string $password) {
                $globalUser->password = $password; // cast 'hashed' handles hashing
                $globalUser->save();

                // Dispatching GlobalUserUpdated triggers SyncTenantUsersListener,
                // which syncs the new password down to all tenant User records automatically.
                GlobalUserUpdated::dispatch($globalUser, ['password']);

                // Revoke all existing landlord tokens for security
                $globalUser->tokens()->delete();
            }
        );
    }
}
