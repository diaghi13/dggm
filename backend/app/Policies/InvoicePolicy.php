<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

/**
 * Invoice Policy
 *
 * Authorization logic for invoice management.
 *
 * Business Rules:
 * - Cannot modify invoices already sent or paid
 * - Can only delete draft invoices
 * - Requires specific permissions for send action
 */
class InvoicePolicy
{
    /**
     * Determine whether the user can view any invoices.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('invoices.view');
    }

    /**
     * Determine whether the user can view the invoice.
     */
    public function view(User $user, Invoice $invoice): bool
    {
        return $user->can('invoices.view');
    }

    /**
     * Determine whether the user can create invoices.
     */
    public function create(User $user): bool
    {
        return $user->can('invoices.create');
    }

    /**
     * Determine whether the user can update the invoice.
     *
     * Business Rule: Cannot modify invoices that are sent or paid.
     */
    public function update(User $user, Invoice $invoice): bool
    {
        if (! $user->can('invoices.edit')) {
            return false;
        }

        // Cannot modify invoices already sent or paid
        if (in_array($invoice->status, ['sent', 'paid'], true)) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can delete the invoice.
     *
     * Business Rule: Can only delete draft invoices.
     */
    public function delete(User $user, Invoice $invoice): bool
    {
        if (! $user->can('invoices.delete')) {
            return false;
        }

        // Can only delete draft invoices
        return $invoice->status === 'draft';
    }

    /**
     * Determine whether the user can send the invoice.
     *
     * Business Rule: Can only send draft invoices.
     */
    public function send(User $user, Invoice $invoice): bool
    {
        if (! $user->can('invoices.send')) {
            return false;
        }

        // Can only send draft invoices
        return $invoice->status === 'draft';
    }

    /**
     * Determine whether the user can restore the invoice.
     */
    public function restore(User $user, Invoice $invoice): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can permanently delete the invoice.
     */
    public function forceDelete(User $user, Invoice $invoice): bool
    {
        return $user->hasRole('super-admin');
    }
}
