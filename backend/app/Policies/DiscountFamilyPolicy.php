<?php

namespace App\Policies;

use App\Models\DiscountFamily;
use App\Models\User;

class DiscountFamilyPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('discount-families.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, DiscountFamily $discountFamily): bool
    {
        return $user->can('discount-families.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('discount-families.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, DiscountFamily $discountFamily): bool
    {
        return $user->can('discount-families.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, DiscountFamily $discountFamily): bool
    {
        return $user->can('discount-families.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, DiscountFamily $discountFamily): bool
    {
        return $user->can('discount-families.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, DiscountFamily $discountFamily): bool
    {
        return $user->can('discount-families.delete');
    }
}
