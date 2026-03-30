<?php

namespace App\Policies;

use App\Models\ProjectLaborLog;
use App\Models\User;

class ProjectLaborLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('projects.view');
    }

    public function view(User $user, ProjectLaborLog $log): bool
    {
        // PM can view all; worker can view their own
        if ($user->can('projects.edit')) {
            return true;
        }

        $worker = $user->worker;

        return $worker && $log->worker_id === $worker->id;
    }

    public function create(User $user): bool
    {
        return $user->can('projects.view'); // Workers can submit hours
    }

    public function update(User $user, ProjectLaborLog $log): bool
    {
        // Only PM/Admin can approve/reject
        return $user->can('projects.edit');
    }

    public function delete(User $user, ProjectLaborLog $log): bool
    {
        return $user->can('projects.delete');
    }
}
