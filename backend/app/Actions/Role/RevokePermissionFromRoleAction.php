<?php

namespace App\Actions\Role;

use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Revoke Permission from Role Action
 *
 * Removes a single permission from a role.
 */
class RevokePermissionFromRoleAction
{
    public function execute(Role $role, Permission $permission): Role
    {
        return DB::transaction(function () use ($role, $permission) {
            $role->revokePermissionTo($permission);

            // Clear permission cache
            app()[PermissionRegistrar::class]->forgetCachedPermissions();

            return $role->fresh(['permissions']);
        });
    }
}
