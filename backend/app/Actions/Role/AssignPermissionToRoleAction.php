<?php

namespace App\Actions\Role;

use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Assign Permission to Role Action
 *
 * Assigns a single permission to a role.
 */
class AssignPermissionToRoleAction
{
    public function execute(Role $role, Permission $permission): Role
    {
        return DB::transaction(function () use ($role, $permission) {
            $role->givePermissionTo($permission);

            // Clear permission cache
            app()[PermissionRegistrar::class]->forgetCachedPermissions();

            return $role->fresh(['permissions']);
        });
    }
}
