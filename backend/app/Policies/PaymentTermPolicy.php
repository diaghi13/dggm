<?php

namespace App\Policies;

use App\Models\PaymentTerm;
use App\Models\User;

class PaymentTermPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('payment-terms.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PaymentTerm $paymentTerm): bool
    {
        return $user->can('payment-terms.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('payment-terms.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, PaymentTerm $paymentTerm): bool
    {
        return $user->can('payment-terms.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PaymentTerm $paymentTerm): bool
    {
        return $user->can('payment-terms.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PaymentTerm $paymentTerm): bool
    {
        return $user->can('payment-terms.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PaymentTerm $paymentTerm): bool
    {
        return $user->can('payment-terms.delete');
    }
}
