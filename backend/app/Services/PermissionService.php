<?php

namespace App\Services;

use App\Data\PermissionData;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

/**
 * Permission Service
 *
 * Handles all permission-related business logic.
 */
class PermissionService
{
    /**
     * Get all permissions
     */
    public function getAll(): \Illuminate\Database\Eloquent\Collection
    {
        return Permission::orderBy('name')->get();
    }

    /**
     * Get permissions grouped by module
     */
    public function getGrouped(): \Illuminate\Support\Collection
    {
        $permissions = $this->getAll();

        return $permissions->groupBy(function ($permission) {
            // Extract module from permission name (e.g., 'users.view' → 'users')
            $parts = explode('.', $permission->name, 2);

            return $parts[0] ?? 'other';
        });
    }

    /**
     * Get single permission by ID
     */
    public function getById(int $id): ?Permission
    {
        return Permission::find($id);
    }

    /**
     * Create new permission
     */
    public function create(PermissionData $data): Permission
    {
        return DB::transaction(function () use ($data) {
            $permission = Permission::create([
                'name' => $data->name,
                'guard_name' => $data->guard_name,
                'display_name' => $data->display_name instanceof \Spatie\LaravelData\Optional
                    ? $data->name
                    : $data->display_name,
                'description' => $data->description instanceof \Spatie\LaravelData\Optional
                    ? null
                    : $data->description,
            ]);

            // Clear permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return $permission->fresh();
        });
    }

    /**
     * Update existing permission
     */
    public function update(Permission $permission, PermissionData $data): Permission
    {
        return DB::transaction(function () use ($permission, $data) {
            $updateData = [
                'name' => $data->name,
                'guard_name' => $data->guard_name,
            ];

            // Update display_name if provided
            if (! ($data->display_name instanceof \Spatie\LaravelData\Optional)) {
                $updateData['display_name'] = $data->display_name;
            }

            // Update description if provided
            if (! ($data->description instanceof \Spatie\LaravelData\Optional)) {
                $updateData['description'] = $data->description;
            }

            $permission->update($updateData);

            // Clear permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return $permission->fresh();
        });
    }

    /**
     * Delete permission
     */
    public function delete(Permission $permission): bool
    {
        return DB::transaction(function () use ($permission) {
            // Detach permission from all roles
            $permission->roles()->detach();

            // Delete permission
            $deleted = $permission->delete();

            // Clear permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return $deleted;
        });
    }
}
