<?php

namespace App\Listeners;

use App\Events\GlobalUserUpdated;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;

class SyncTenantUsersListener implements ShouldQueue
{
    public int $tries = 3;

    public function handle(GlobalUserUpdated $event): void
    {
        $globalUser = $event->globalUser;
        $changedFields = $event->changedFields;

        // Only sync relevant fields
        $syncableFields = ['name', 'email', 'password'];
        $fieldsToSync = array_intersect($changedFields, $syncableFields);

        if (empty($fieldsToSync)) {
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

            $tenant->run(function () use ($globalUser, $fieldsToSync): void {
                $user = User::where('global_user_id', $globalUser->id)->first();
                if (! $user) {
                    return;
                }

                $updates = [];
                if (in_array('name', $fieldsToSync, true)) {
                    $updates['name'] = $globalUser->name;
                }
                if (in_array('email', $fieldsToSync, true)) {
                    $updates['email'] = $globalUser->email;
                }

                if (! empty($updates)) {
                    $user->update($updates);
                }

                // Password: bypass hashed cast to avoid double-hashing
                if (in_array('password', $fieldsToSync, true)) {
                    $user->setRawAttributes(array_merge($user->getAttributes(), [
                        'password' => $globalUser->getRawOriginal('password'),
                    ]));
                    $user->saveQuietly();
                }
            });
        }
    }
}
