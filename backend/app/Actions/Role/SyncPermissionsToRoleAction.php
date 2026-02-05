<?php

namespace App\Actions\Role;

use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Sync Permissions to Role Action
 *
 * Replaces all role permissions with a new set (bulk operation).
 *
 * Business Rules:
 * - Removes all existing permissions
 * - Assigns new permissions
 * - Atomic operation (all or nothing)
 *
 * @param  array<string>  $permissions  Array of permission names
 */
class SyncPermissionsToRoleAction
{
    public function execute(Role $role, array $permissions): Role
    {
        return DB::transaction(function () use ($role, $permissions) {
            // Sync permissions (removes old, adds new)
            $role->syncPermissions($permissions);

            // Clear permission cache
            app()[PermissionRegistrar::class]->forgetCachedPermissions();

            return $role->fresh(['permissions']);
        });
    }
}
