<?php

namespace App\Policies;

use App\Models\SiteWorker;
use App\Models\User;

class SiteWorkerPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('sites.view') ||
            $user->can('site_workers.view') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager', 'Foreman', 'Worker']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SiteWorker $siteWorker): bool
    {
        if ($user->can('site_workers.view') || $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager'])) {
            return true;
        }

        if ($user->hasRole('Worker') && $user->worker) {
            return $siteWorker->worker_id === $user->worker->id;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('site_workers.create') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SiteWorker $siteWorker): bool
    {
        return $user->can('site_workers.update') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SiteWorker $siteWorker): bool
    {
        return $user->can('site_workers.delete') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can respond to an assignment (accept/reject).
     * Only the worker themselves can respond to their assignment.
     */
    public function respond(User $user, SiteWorker $siteWorker): bool
    {
        if ($user->hasRole(['SuperAdmin', 'Admin'])) {
            return true;
        }

        if ($user->worker && $siteWorker->worker_id === $user->worker->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can manually change the status of an assignment.
     * Only PMs and Admins can manually change status.
     */
    public function changeStatus(User $user, SiteWorker $siteWorker): bool
    {
        return $user->can('site_workers.update') ||
            $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SiteWorker $siteWorker): bool
    {
        return $user->can('site_workers.delete') ||
            $user->hasRole(['SuperAdmin', 'Admin']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SiteWorker $siteWorker): bool
    {
        return $user->can('site_workers.delete') ||
            $user->hasRole(['SuperAdmin', 'Admin']);
    }
}
