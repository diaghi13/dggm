<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WarrantyType;

class WarrantyTypePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('warranty-types.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, WarrantyType $warrantyType): bool
    {
        return $user->can('warranty-types.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('warranty-types.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, WarrantyType $warrantyType): bool
    {
        return $user->can('warranty-types.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, WarrantyType $warrantyType): bool
    {
        return $user->can('warranty-types.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, WarrantyType $warrantyType): bool
    {
        return $user->can('warranty-types.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, WarrantyType $warrantyType): bool
    {
        return $user->can('warranty-types.delete');
    }
}
