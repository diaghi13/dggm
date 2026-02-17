<?php

namespace App\Listeners;

use App\Events\QuoteApproved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * NotifyProjectManagerOfQuoteApproval
 *
 * Sends notification to project manager when quote is approved.
 * Queued for performance.
 */
class NotifyProjectManagerOfQuoteApproval implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    /**
     * Handle the event
     */
    public function handle(QuoteApproved $event): void
    {
        // TODO: Implement email notification when ready
        // if ($event->quote->projectManager) {
        //     Mail::to($event->quote->projectManager->email)
        //         ->send(new QuoteApprovedMail($event->quote));
        // }

        Log::info('Quote approved - notification would be sent', [
            'quote_id' => $event->quote->id,
            'project_manager_id' => $event->quote->project_manager_id,
        ]);
    }
}
