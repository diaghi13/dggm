<?php

namespace App\Policies;

use App\Models\ProjectRole;
use App\Models\User;

class ProjectRolePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('project_roles.view')
            || $user->can('project_workers.view')
            || $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager', 'Foreman', 'super-admin', 'admin', 'project-manager', 'team-leader']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ProjectRole $projectRole): bool
    {
        return $user->can('project_roles.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('project_roles.create') ||
            $user->hasRole(['SuperAdmin', 'Admin']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ProjectRole $projectRole): bool
    {
        return $user->can('project_roles.update') ||
            $user->hasRole(['SuperAdmin', 'Admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ProjectRole $projectRole): bool
    {
        return $user->can('project_roles.delete') ||
            $user->hasRole(['SuperAdmin', 'Admin']);
    }
}
