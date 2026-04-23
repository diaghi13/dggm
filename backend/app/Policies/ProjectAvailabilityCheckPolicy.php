<?php

namespace App\Policies;

use App\Models\ProjectAvailabilityCheck;
use App\Models\User;

class ProjectAvailabilityCheckPolicy
{
    /**
     * Determine whether the user can view any checks (reuses project view permission).
     */
    public function viewAny(User $user): bool
    {
        return $user->can('projects.view');
    }

    /**
     * Determine whether the user can view a specific check.
     */
    public function view(User $user, ProjectAvailabilityCheck $check): bool
    {
        return $user->can('projects.view');
    }

    /**
     * Determine whether the user can run a new availability check (PM or admin).
     */
    public function create(User $user): bool
    {
        return $user->can('projects.edit') || $user->can('projects.create');
    }

    /**
     * Determine whether the user can resolve items (PM or admin).
     */
    public function update(User $user, ProjectAvailabilityCheck $check): bool
    {
        return $user->can('projects.edit');
    }
}
