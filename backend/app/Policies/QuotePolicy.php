<?php

namespace App\Policies;

use App\Models\Quote;
use App\Models\User;

class QuotePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('quotes.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Quote $quote): bool
    {
        return $user->can('quotes.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('quotes.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Quote $quote): bool
    {
        // Can only update draft or sent quotes
        if (! $quote->canBeEdited()) {
            return false;
        }

        return $user->can('quotes.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Quote $quote): bool
    {
        // Can only delete draft quotes
        if ($quote->status !== 'draft') {
            return false;
        }

        return $user->can('quotes.delete');
    }

    /**
     * Determine whether the user can approve the model.
     */
    public function approve(User $user, Quote $quote): bool
    {
        // Can only approve sent quotes
        if (! $quote->canBeApproved()) {
            return false;
        }

        return $user->can('quotes.approve');
    }

    /**
     * Determine whether the user can reject the model.
     */
    public function reject(User $user, Quote $quote): bool
    {
        // Can only reject sent quotes
        if ($quote->status !== 'sent') {
            return false;
        }

        return $user->can('quotes.approve'); // Same permission as approve
    }

    /**
     * Determine whether the user can send the model.
     */
    public function send(User $user, Quote $quote): bool
    {
        // Can only send draft quotes
        if ($quote->status !== 'draft') {
            return false;
        }

        return $user->can('quotes.edit');
    }

    /**
     * Determine whether the user can convert the quote to a project.
     */
    public function convertToProject(User $user, Quote $quote): bool
    {
        // Can only convert approved quotes
        if ($quote->status !== 'approved') {
            return false;
        }

        // Quote must not already be converted
        if ($quote->project_id !== null) {
            return false;
        }

        return $user->can('quotes.convert-to-project');
    }

    /**
     * Determine whether the user can generate PDF for the quote.
     */
    public function generatePdf(User $user, Quote $quote): bool
    {
        return $user->can('quotes.view');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Quote $quote): bool
    {
        return $user->can('quotes.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Quote $quote): bool
    {
        return $user->can('quotes.delete');
    }
}
