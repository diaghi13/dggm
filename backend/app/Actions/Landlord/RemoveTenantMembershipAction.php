<?php

declare(strict_types=1);

namespace App\Actions\Landlord;

use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RemoveTenantMembershipAction
{
    public function execute(TenantMembership $membership): void
    {
        DB::connection('landlord')->transaction(function () use ($membership) {
            $globalUser = $membership->globalUser;
            $tenant = Tenant::findOrFail($membership->tenant_id);

            $tenant->run(function () use ($globalUser) {
                $user = User::where('email', $globalUser->email)->first();
                if ($user) {
                    $user->syncRoles([]);
                }
            });

            $membership->delete();
        });
    }
}
