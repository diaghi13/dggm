<?php

namespace App\Policies;

use App\Enums\FinalBalanceStatus;
use App\Models\FinalBalance;
use App\Models\User;

class FinalBalancePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('projects.view') || $user->hasRole('admin') || $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, FinalBalance $finalBalance): bool
    {
        return $user->can('projects.view') || $user->hasRole('admin') || $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('project-manager') || $user->hasRole('admin') || $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, FinalBalance $finalBalance): bool
    {
        return $user->hasRole('project-manager') || $user->hasRole('admin') || $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can finalize the model.
     */
    public function finalize(User $user, FinalBalance $finalBalance): bool
    {
        return $user->hasRole('project-manager') || $user->hasRole('admin') || $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can approve the model.
     */
    public function approve(User $user, FinalBalance $finalBalance): bool
    {
        return $user->hasRole('admin') || $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can delete the model (draft only).
     */
    public function delete(User $user, FinalBalance $finalBalance): bool
    {
        return ($user->hasRole('admin') || $user->hasRole('super-admin'))
            && $finalBalance->status === FinalBalanceStatus::Draft;
    }
}
