<?php

namespace App\Policies;

use App\Models\ProductRelationType;
use App\Models\User;

class ProductRelationTypePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('products.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ProductRelationType $productRelationType): bool
    {
        return $user->can('products.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('products.edit');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ProductRelationType $productRelationType): bool
    {
        return $user->can('products.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ProductRelationType $productRelationType): bool
    {
        return $user->can('products.delete');
    }
}
