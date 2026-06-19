<?php

namespace App\Domains\Warehouse\Policies;

use App\Domains\Warehouse\Models\RentalReturnInspection;
use App\Models\User;

class RentalReturnInspectionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function view(User $user, RentalReturnInspection $inspection): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function create(User $user): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function update(User $user, RentalReturnInspection $inspection): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function finalize(User $user, RentalReturnInspection $inspection): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }
}
