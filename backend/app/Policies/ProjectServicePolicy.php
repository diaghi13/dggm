<?php

namespace App\Policies;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectService;
use App\Enums\ProjectServiceStatus;
use App\Models\User;

class ProjectServicePolicy
{
    public function viewAny(User $user, Project $project): bool
    {
        return $user->can('projects.view');
    }

    public function view(User $user, ProjectService $service): bool
    {
        return $user->can('projects.view');
    }

    public function create(User $user, Project $project): bool
    {
        return $user->can('projects.update');
    }

    public function update(User $user, ProjectService $service): bool
    {
        return $user->can('projects.update');
    }

    public function delete(User $user, ProjectService $service): bool
    {
        if ($service->status === ProjectServiceStatus::Completed) {
            return false;
        }

        return $user->can('projects.update');
    }
}
