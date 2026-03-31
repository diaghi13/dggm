<?php

declare(strict_types=1);

namespace App\Actions\Landlord;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use App\Notifications\TenantInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InviteTenantMemberAction
{
    public function execute(string $tenantId, string $email, string $role = 'admin'): TenantMembership
    {
        $tenant = Tenant::findOrFail($tenantId);

        return DB::connection('landlord')->transaction(function () use ($tenant, $email, $role) {
            // Find or create a GlobalUser for this email
            $globalUser = GlobalUser::where('email', $email)->first();

            if (! $globalUser) {
                // Create a stub GlobalUser — password will be set when they accept
                $namePart = Str::before($email, '@');
                $globalUser = GlobalUser::create([
                    'name' => ucfirst($namePart),
                    'email' => $email,
                    'password' => Str::random(32),
                ]);
            }

            // Check for an existing membership
            $existing = TenantMembership::where('global_user_id', $globalUser->id)
                ->where('tenant_id', $tenant->id)
                ->first();

            if ($existing) {
                if ($existing->status === 'active') {
                    throw ValidationException::withMessages([
                        'email' => ['Questo utente ha già accesso a questo tenant.'],
                    ]);
                }

                // Re-invite: refresh token and expiry
                $existing->update([
                    'role' => $role,
                    'invitation_token' => Str::random(64),
                    'invited_at' => now(),
                    'expires_at' => now()->addDays(7),
                    'status' => 'invited',
                ]);

                $membership = $existing->fresh();
            } else {
                $membership = TenantMembership::create([
                    'global_user_id' => $globalUser->id,
                    'tenant_id' => $tenant->id,
                    'role' => $role,
                    'status' => 'invited',
                    'invitation_token' => Str::random(64),
                    'invited_at' => now(),
                    'expires_at' => now()->addDays(7),
                ]);
            }

            Notification::route('mail', $email)->notify(
                new TenantInvitationNotification($membership, $globalUser, $tenant)
            );

            return $membership;
        });
    }
}
