<?php

namespace App\Policies;

use App\Models\RentalProfile;
use App\Models\User;

class RentalProfilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('settings.view') || $user->can('materials.view');
    }

    public function view(User $user, RentalProfile $rentalProfile): bool
    {
        return $user->can('settings.view') || $user->can('materials.view');
    }

    public function create(User $user): bool
    {
        return $user->can('settings.edit');
    }

    public function update(User $user, RentalProfile $rentalProfile): bool
    {
        return $user->can('settings.edit');
    }

    public function delete(User $user, RentalProfile $rentalProfile): bool
    {
        return $user->can('settings.edit');
    }
}
