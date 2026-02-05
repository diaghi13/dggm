<?php

namespace App\Actions\Role;

use App\Data\RoleData;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Update Role Action
 *
 * Handles updating existing roles.
 *
 * Business Rules:
 * - Role name is IMMUTABLE (cannot be changed)
 * - Only display_name, description can be updated
 * - Permissions can be synced
 * - Clear permission cache after update
 */
class UpdateRoleAction
{
    public function execute(Role $role, RoleData $data): Role
    {
        return DB::transaction(function () use ($role, $data) {
            // Update role metadata (name is immutable, not updated)
            $updateData = [];

            // Update display_name if provided
            if (! ($data->display_name instanceof \Spatie\LaravelData\Optional)) {
                $updateData['display_name'] = $data->display_name;
            }

            // Update description if provided
            if (! ($data->description instanceof \Spatie\LaravelData\Optional)) {
                $updateData['description'] = $data->description;
            }

            // Update role attributes if any
            if (! empty($updateData)) {
                $role->update($updateData);
            }

            // Sync permissions if provided
            if (isset($data->permissions)) {
                $role->syncPermissions($data->permissions);
            }

            // Clear permission cache
            app()[PermissionRegistrar::class]->forgetCachedPermissions();

            return $role->fresh(['permissions']);
        });
    }
}
