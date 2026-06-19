<?php

namespace App\Domains\Product\Policies;

use App\Domains\Product\Models\ProductUnitType;
use App\Models\User;

class ProductUnitTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('products.view');
    }

    public function view(User $user, ProductUnitType $productUnitType): bool
    {
        return $user->can('products.view');
    }

    public function create(User $user): bool
    {
        return $user->can('products.edit');
    }

    public function update(User $user, ProductUnitType $productUnitType): bool
    {
        return $user->can('products.edit');
    }

    public function delete(User $user, ProductUnitType $productUnitType): bool
    {
        return $user->can('products.delete');
    }
}
