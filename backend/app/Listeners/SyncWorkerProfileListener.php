<?php

namespace App\Listeners;

use App\Events\GlobalUserUpdated;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use Illuminate\Contracts\Queue\ShouldQueue;

class SyncWorkerProfileListener implements ShouldQueue
{
    public int $tries = 3;

    public function handle(GlobalUserUpdated $event): void
    {
        $globalUser = $event->globalUser;
        $defaults = $globalUser->workerProfileDefaults();

        if (empty($defaults)) {
            return;
        }

        $memberships = TenantMembership::where('global_user_id', $globalUser->id)
            ->where('status', 'active')
            ->get();

        foreach ($memberships as $membership) {
            $tenant = Tenant::find($membership->tenant_id);
            if (! $tenant) {
                continue;
            }

            $tenant->run(function () use ($globalUser, $defaults) {
                \App\Models\Worker::where('global_user_id', $globalUser->id)
                    ->update($defaults);
            });
        }
    }
}
