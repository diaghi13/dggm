<?php

namespace App\Actions\Role;

use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Delete Role Action
 *
 * Handles safe deletion of roles.
 *
 * Business Rules:
 * - Cannot delete system roles (super-admin, admin)
 * - Cannot delete roles that have users assigned
 * - Revokes all permissions before deletion
 * - Clear permission cache after deletion
 *
 * @throws \Exception if role is system role or has users
 */
class DeleteRoleAction
{
    public function execute(Role $role): bool
    {
        // Prevent deletion of system roles
        if (in_array($role->name, ['super-admin', 'admin'], true)) {
            throw new \Exception('Cannot delete system role');
        }

        // Prevent deletion if role has users
        if ($role->users()->count() > 0) {
            throw new \Exception('Cannot delete role with assigned users. Please reassign users first.');
        }

        return DB::transaction(function () use ($role) {
            // Revoke all permissions
            $role->revokePermissionTo($role->permissions);

            // Delete role
            $deleted = $role->delete();

            // Clear permission cache
            app()[PermissionRegistrar::class]->forgetCachedPermissions();

            return $deleted;
        });
    }
}
