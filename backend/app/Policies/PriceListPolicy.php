<?php

namespace App\Policies;

use App\Models\PriceList;
use App\Models\User;

class PriceListPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('price-lists.view');
    }

    public function view(User $user, PriceList $priceList): bool
    {
        return $user->can('price-lists.view');
    }

    public function create(User $user): bool
    {
        return $user->can('price-lists.create');
    }

    public function update(User $user, PriceList $priceList): bool
    {
        return $user->can('price-lists.edit');
    }

    public function delete(User $user, PriceList $priceList): bool
    {
        return $user->can('price-lists.delete');
    }

    public function regenerate(User $user, PriceList $priceList): bool
    {
        return $user->can('price-lists.regenerate');
    }
}
