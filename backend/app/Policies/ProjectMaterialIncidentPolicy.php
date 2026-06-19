<?php

namespace App\Policies;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectMaterialIncident;
use App\Models\User;

class ProjectMaterialIncidentPolicy
{
    public function viewAny(User $user, Project $project): bool
    {
        return $user->can('projects.view');
    }

    public function view(User $user, ProjectMaterialIncident $incident): bool
    {
        return $user->can('projects.view');
    }

    public function create(User $user, Project $project): bool
    {
        return $user->can('projects.view');
    }

    public function update(User $user, ProjectMaterialIncident $incident): bool
    {
        return $user->can('projects.update');
    }

    public function resolve(User $user, ProjectMaterialIncident $incident): bool
    {
        return $user->can('projects.update');
    }
}
