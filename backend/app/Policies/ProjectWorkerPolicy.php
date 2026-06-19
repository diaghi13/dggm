<?php

namespace App\Policies;

use App\Domains\Project\Models\ProjectWorker;
use App\Models\User;

class ProjectWorkerPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('projects.view') ||
            $user->can('project_workers.view') ||
            $user->hasRole(['super-admin', 'admin', 'project-manager', 'team-leader', 'worker']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ProjectWorker $projectWorker): bool
    {
        if ($user->can('project_workers.view') || $user->hasRole(['super-admin', 'admin', 'project-manager'])) {
            return true;
        }

        if ($user->hasRole('worker') && $user->worker) {
            return $projectWorker->worker_id === $user->worker->id;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('project_workers.create') ||
            $user->hasRole(['super-admin', 'admin', 'project-manager']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ProjectWorker $projectWorker): bool
    {
        return $user->can('project_workers.update') ||
            $user->hasRole(['super-admin', 'admin', 'project-manager']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ProjectWorker $projectWorker): bool
    {
        return $user->can('project_workers.delete') ||
            $user->hasRole(['super-admin', 'admin', 'project-manager']);
    }

    /**
     * Determine whether the user can respond to an assignment (accept/reject).
     * PMs and Admins can accept/reject on behalf of workers.
     */
    public function respond(User $user, ProjectWorker $projectWorker): bool
    {
        if ($user->hasRole(['super-admin', 'admin', 'project-manager'])) {
            return true;
        }

        if ($user->worker && $projectWorker->worker_id === $user->worker->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can manually change the status of an assignment.
     * Only PMs and Admins can manually change status.
     */
    public function changeStatus(User $user, ProjectWorker $projectWorker): bool
    {
        return $user->can('project_workers.update') ||
            $user->hasRole(['super-admin', 'admin', 'project-manager']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ProjectWorker $projectWorker): bool
    {
        return $user->can('project_workers.delete') ||
            $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ProjectWorker $projectWorker): bool
    {
        return $user->can('project_workers.delete') ||
            $user->hasRole(['super-admin', 'admin']);
    }
}
