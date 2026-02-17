<?php

namespace App\Policies;

use App\Models\FinancialResource;
use App\Models\User;

class FinancialResourcePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('financial-resources.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, FinancialResource $financialResource): bool
    {
        return $user->can('financial-resources.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('financial-resources.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, FinancialResource $financialResource): bool
    {
        return $user->can('financial-resources.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, FinancialResource $financialResource): bool
    {
        return $user->can('financial-resources.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, FinancialResource $financialResource): bool
    {
        return $user->can('financial-resources.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, FinancialResource $financialResource): bool
    {
        return $user->can('financial-resources.delete');
    }
}
