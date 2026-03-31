<?php

declare(strict_types=1);

namespace App\Actions\Landlord;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddTenantMembershipAction
{
    public function execute(GlobalUser $globalUser, string $tenantId, string $role = 'admin'): TenantMembership
    {
        $tenant = Tenant::findOrFail($tenantId);

        return DB::connection('landlord')->transaction(function () use ($globalUser, $tenant, $role) {
            if (TenantMembership::where('global_user_id', $globalUser->id)
                ->where('tenant_id', $tenant->id)
                ->exists()) {
                throw ValidationException::withMessages([
                    'tenant_id' => ['L\'utente è già membro di questo tenant.'],
                ]);
            }

            $membership = TenantMembership::create([
                'global_user_id' => $globalUser->id,
                'tenant_id' => $tenant->id,
                'role' => $role,
                'status' => 'active',
            ]);

            $tenant->run(function () use ($globalUser, $role) {
                $user = User::where('email', $globalUser->email)->first();

                if (! $user) {
                    $user = new User;
                    $user->name = $globalUser->name;
                    $user->email = $globalUser->email;
                    $user->global_user_id = $globalUser->id;
                    $user->setRawAttributes(array_merge($user->getAttributes(), [
                        'password' => $globalUser->getRawOriginal('password'),
                    ]));
                    $user->save();
                }

                if (! $user->hasRole($role)) {
                    $user->assignRole($role);
                }
            });

            return $membership;
        });
    }
}
