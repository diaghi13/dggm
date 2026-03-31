<?php

declare(strict_types=1);

namespace App\Actions\Landlord;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AcceptTenantInvitationAction
{
    /**
     * @return array{membership: TenantMembership, globalUser: GlobalUser}
     */
    public function execute(string $token, ?string $password = null): array
    {
        $membership = TenantMembership::where('invitation_token', $token)
            ->where('status', 'invited')
            ->firstOrFail();

        if ($membership->expires_at && $membership->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'token' => ["L'invito è scaduto. Chiedi un nuovo invito."],
            ]);
        }

        return DB::connection('landlord')->transaction(function () use ($membership, $password) {
            $globalUser = GlobalUser::findOrFail($membership->global_user_id);
            $tenant = Tenant::findOrFail($membership->tenant_id);

            // Update password if provided (new users who didn't previously exist)
            if ($password) {
                $globalUser->update(['password' => $password]);
            }

            // Activate membership and clear invitation token
            $membership->update([
                'status' => 'active',
                'invitation_token' => null,
            ]);

            // Create or link the User in the tenant DB
            $tenant->run(function () use ($globalUser, $membership) {
                $user = \App\Models\User::where('global_user_id', $globalUser->id)
                    ->orWhere('email', $globalUser->email)
                    ->first();

                if (! $user) {
                    $user = new \App\Models\User;
                    $user->name = $globalUser->name;
                    $user->email = $globalUser->email;
                    $user->global_user_id = $globalUser->id;
                    // Bypass 'hashed' cast — password is already bcrypt-hashed in GlobalUser
                    $user->setRawAttributes(array_merge($user->getAttributes(), [
                        'password' => $globalUser->getRawOriginal('password'),
                    ]));
                    $user->save();
                } else {
                    // Link existing tenant user to the GlobalUser if not already linked
                    if (! $user->global_user_id) {
                        $user->update(['global_user_id' => $globalUser->id]);
                    }
                }

                if (! $user->hasRole($membership->role)) {
                    $user->assignRole($membership->role);
                }
            });

            return ['membership' => $membership->fresh(), 'globalUser' => $globalUser];
        });
    }
}
