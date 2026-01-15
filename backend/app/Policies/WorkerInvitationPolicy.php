<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkerInvitation;

class WorkerInvitationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('workers.view') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, WorkerInvitation $workerInvitation): bool
    {
        return $user->can('workers.view') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('workers.create') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, WorkerInvitation $workerInvitation): bool
    {
        return $user->can('workers.update') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, WorkerInvitation $workerInvitation): bool
    {
        return $user->can('workers.delete') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, WorkerInvitation $workerInvitation): bool
    {
        return $user->can('workers.delete') ||
            $user->hasRole(['SuperAdmin', 'Admin']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, WorkerInvitation $workerInvitation): bool
    {
        return $user->can('workers.delete') ||
            $user->hasRole(['SuperAdmin', 'Admin']);
    }
}
