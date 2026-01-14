<?php

namespace App\Policies;

use App\Models\SiteLaborCost;
use App\Models\User;

class SiteLaborCostPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('labor-costs.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SiteLaborCost $siteLaborCost): bool
    {
        return $user->can('labor-costs.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('labor-costs.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SiteLaborCost $siteLaborCost): bool
    {
        return $user->can('labor-costs.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SiteLaborCost $siteLaborCost): bool
    {
        return $user->can('labor-costs.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SiteLaborCost $siteLaborCost): bool
    {
        return $user->can('labor-costs.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, SiteLaborCost $siteLaborCost): bool
    {
        return $user->can('labor-costs.delete');
    }

    /**
     * Determine whether the user can approve contractor invoices.
     */
    public function approve(User $user, SiteLaborCost $siteLaborCost): bool
    {
        return $user->can('labor-costs.approve');
    }
}
