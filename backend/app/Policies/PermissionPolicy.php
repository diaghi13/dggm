<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Permission;

/**
 * Permission Policy
 *
 * Authorization logic for permission management.
 *
 * Business Rules:
 * - Only super-admin can create/update/delete permissions
 * - Users with permissions.view can view permissions
 * - Permissions are critical to security - handle with care
 */
class PermissionPolicy
{
    /**
     * Determine if user can view any permissions.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('permissions.view');
    }

    /**
     * Determine if user can view a specific permission.
     */
    public function view(User $user, Permission $permission): bool
    {
        return $user->can('permissions.view');
    }

    /**
     * Only super-admin can create permissions
     */
    public function create(User $user): bool
    {
        return $user->can('permissions.create');
    }

    /**
     * Only super-admin can update permissions
     */
    public function update(User $user, Permission $permission): bool
    {
        return $user->can('permissions.edit');
    }

    /**
     * Only super-admin can delete permissions
     */
    public function delete(User $user, Permission $permission): bool
    {
        return $user->can('permissions.delete');
    }
}
