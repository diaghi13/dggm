<?php

namespace App\Policies;

use App\Models\ProjectExpense;
use App\Models\User;

class ProjectExpensePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('projects.view');
    }

    public function view(User $user, ProjectExpense $expense): bool
    {
        // PM can view all; submitter can view their own
        if ($user->can('projects.edit')) {
            return true;
        }

        return $expense->submitted_by_user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('projects.view'); // Both PM and workers can submit expenses
    }

    public function update(User $user, ProjectExpense $expense): bool
    {
        // PM can approve/reject; submitter can edit their own draft
        if ($user->can('projects.edit')) {
            return true;
        }

        return $expense->submitted_by_user_id === $user->id;
    }

    public function delete(User $user, ProjectExpense $expense): bool
    {
        if ($user->can('projects.delete')) {
            return true;
        }

        return $expense->submitted_by_user_id === $user->id;
    }
}
