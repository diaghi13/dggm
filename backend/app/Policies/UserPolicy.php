<?php

namespace App\Policies;

use App\Models\User;

/**
 * User Policy
 *
 * Authorization logic for user management.
 *
 * Business Rules:
 * - Users cannot delete themselves
 * - Cannot modify super-admin users (unless you are super-admin)
 * - Requires appropriate permissions (users.view, users.create, etc.)
 */
class UserPolicy
{
    /**
     * View any users list
     */
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    /**
     * View a specific user
     */
    public function view(User $user, User $targetUser): bool
    {
        return $user->can('users.view');
    }

    /**
     * Create a new user
     */
    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    /**
     * Update a user
     *
     * Cannot modify super-admin unless you are super-admin
     */
    public function update(User $user, User $targetUser): bool
    {
        // Must have permission
        if (! $user->can('users.edit')) {
            return false;
        }

        // Cannot modify super-admin unless you are super-admin
        if ($targetUser->hasRole('super-admin') && ! $user->hasRole('super-admin')) {
            return false;
        }

        return true;
    }

    /**
     * Delete a user
     *
     * Cannot delete yourself
     * Cannot delete super-admin unless you are super-admin
     */
    public function delete(User $user, User $targetUser): bool
    {
        // Must have permission
        if (! $user->can('users.delete')) {
            return false;
        }

        // Cannot delete yourself
        if ($user->id === $targetUser->id) {
            return false;
        }

        // Cannot delete super-admin unless you are super-admin
        if ($targetUser->hasRole('super-admin') && ! $user->hasRole('super-admin')) {
            return false;
        }

        return true;
    }

    /**
     * Restore a deleted user
     */
    public function restore(User $user, User $targetUser): bool
    {
        return $user->can('users.delete');
    }

    /**
     * Permanently delete a user
     */
    public function forceDelete(User $user, User $targetUser): bool
    {
        return $user->can('users.delete');
    }
}
