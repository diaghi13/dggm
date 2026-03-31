<?php

namespace App\Actions\Auth;

use App\Data\ChangePasswordData;
use App\Events\PasswordChanged;
use App\Models\Landlord\GlobalUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ChangePasswordAction
{
    public function execute(User $user, ChangePasswordData $data): User
    {
        // Verify current password
        if (! Hash::check($data->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        // Update tenant user password
        $user->password = Hash::make($data->password);
        $user->save();

        // Sync to GlobalUser in landlord DB so login credentials stay consistent
        $globalUser = GlobalUser::where('email', $user->email)->first();
        if ($globalUser) {
            $globalUser->password = $data->password; // cast 'hashed' handles hashing
            $globalUser->save();
        }

        // Dispatch event for logging/audit
        PasswordChanged::dispatch($user, [
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return $user;
    }
}
