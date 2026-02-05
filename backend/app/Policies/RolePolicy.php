<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

/**
 * Role Policy
 *
 * Authorization logic for role management.
 *
 * Business Rules:
 * - Only super-admin can create/update/delete roles
 * - Users with 'users.view' can view roles (needed for user management)
 * - Super-admin cannot remove their own super-admin role
 */
class RolePolicy
{
    /**
     * Determine if user can view any roles.
     */
    public function viewAny(User $user): bool
    {
        // Users managing other users need to see roles
        return $user->can('users.view') || $user->hasRole('super-admin');
    }

    /**
     * Determine if user can view a specific role.
     */
    public function view(User $user, Role $role): bool
    {
        return $user->can('users.view') || $user->hasRole('super-admin');
    }

    /**
     * Determine if user can create roles.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine if user can update roles.
     */
    public function update(User $user, Role $role): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine if user can delete roles.
     */
    public function delete(User $user, Role $role): bool
    {
        if (! $user->hasRole('super-admin')) {
            return false;
        }

        // Cannot delete system roles
        if (in_array($role->name, ['super-admin', 'admin'], true)) {
            return false;
        }

        return true;
    }

    /**
     * Determine if user can assign permissions to roles.
     */
    public function assignPermission(User $user, Role $role): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine if user can revoke permissions from roles.
     */
    public function revokePermission(User $user, Role $role): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine if user can sync permissions for a role.
     */
    public function syncPermissions(User $user, Role $role): bool
    {
        return $user->hasRole('super-admin');
    }
}
