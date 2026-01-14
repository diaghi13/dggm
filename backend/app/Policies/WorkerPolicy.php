<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Worker;

class WorkerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('workers.view');
    }

    public function view(User $user, Worker $worker): bool
    {
        return $user->can('workers.view');
    }

    public function create(User $user): bool
    {
        return $user->can('workers.create');
    }

    public function update(User $user, Worker $worker): bool
    {
        return $user->can('workers.edit');
    }

    public function delete(User $user, Worker $worker): bool
    {
        return $user->can('workers.delete');
    }

    public function viewPayroll(User $user, Worker $worker): bool
    {
        return $user->can('workers.view-payroll');
    }

    public function managePayroll(User $user, Worker $worker): bool
    {
        return $user->can('workers.manage-payroll');
    }

    public function viewRates(User $user, Worker $worker): bool
    {
        return $user->can('workers.view-rates');
    }

    public function manageRates(User $user, Worker $worker): bool
    {
        return $user->can('workers.manage-rates');
    }
}
