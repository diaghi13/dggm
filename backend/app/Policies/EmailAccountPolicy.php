<?php

namespace App\Policies;

use App\Models\EmailAccount;
use App\Models\User;

class EmailAccountPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('settings.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, EmailAccount $emailAccount): bool
    {
        return $user->can('settings.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['super-admin', 'admin']) || $user->can('settings.manage');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, EmailAccount $emailAccount): bool
    {
        return $user->hasRole(['super-admin', 'admin']) || $user->can('settings.manage');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, EmailAccount $emailAccount): bool
    {
        return $user->hasRole(['super-admin', 'admin']) || $user->can('settings.manage');
    }
}
