<?php

namespace App\Actions\Role;

use App\Data\RoleData;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

/**
 * Create Role Action
 *
 * Handles creation of new roles with optional permission assignment.
 *
 * Business Rules:
 * - Role name must be unique
 * - Permissions are assigned if provided
 * - Wrapped in database transaction for atomicity
 */
class CreateRoleAction
{
    public function execute(RoleData $data): Role
    {
        return DB::transaction(function () use ($data) {
            // Auto-generate display_name if not provided
            $displayName = $data->display_name instanceof \Spatie\LaravelData\Optional
                ? ucwords(str_replace('-', ' ', $data->name))
                : $data->display_name;

            // Create role
            $role = Role::create([
                'name' => $data->name,
                'display_name' => $displayName,
                'description' => $data->description instanceof \Spatie\LaravelData\Optional ? null : $data->description,
                'guard_name' => $data->guard_name,
            ]);

            // Assign permissions if provided
            if (! empty($data->permissions)) {
                $role->syncPermissions($data->permissions);
            }

            return $role->fresh(['permissions']);
        });
    }
}
