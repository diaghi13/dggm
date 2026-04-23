<?php

namespace App\Policies;

use App\Models\RepairOrder;
use App\Models\User;

class RepairOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function view(User $user, RepairOrder $repairOrder): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function create(User $user): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function update(User $user, RepairOrder $repairOrder): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function updateStatus(User $user, RepairOrder $repairOrder): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }

    public function delete(User $user, RepairOrder $repairOrder): bool
    {
        return $user->can('warehouse.manage') || $user->can('admin');
    }
}
