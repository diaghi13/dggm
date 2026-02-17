<?php

namespace App\Listeners;

use App\Events\QuoteApproved;
use App\Events\QuoteConvertedToSite;
use App\Events\QuoteCreated;
use App\Events\QuoteDeleted;
use App\Events\QuoteRejected;
use App\Events\QuoteSent;
use App\Events\QuoteUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * LogQuoteActivity
 *
 * Logs all Quote lifecycle events for comprehensive audit trail.
 * Queued for performance.
 */
class LogQuoteActivity implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(
        QuoteCreated|QuoteUpdated|QuoteSent|QuoteApproved|QuoteRejected|QuoteDeleted|QuoteConvertedToSite $event
    ): void {
        $action = match (true) {
            $event instanceof QuoteCreated => 'created',
            $event instanceof QuoteUpdated => 'updated',
            $event instanceof QuoteSent => 'sent',
            $event instanceof QuoteApproved => 'approved',
            $event instanceof QuoteRejected => 'rejected',
            $event instanceof QuoteDeleted => 'deleted',
            $event instanceof QuoteConvertedToSite => 'converted_to_site',
        };

        $data = match (true) {
            $event instanceof QuoteCreated => [
                'quote_id' => $event->quote->id,
                'code' => $event->quote->code,
                'customer_id' => $event->quote->customer_id,
                'user_id' => $event->metadata['user_id'] ?? null,
                'ip_address' => $event->metadata['ip_address'] ?? null,
            ],
            $event instanceof QuoteUpdated => [
                'quote_id' => $event->quote->id,
                'code' => $event->quote->code,
                'changes' => $event->metadata['changes'] ?? [],
                'user_id' => $event->metadata['user_id'] ?? null,
            ],
            $event instanceof QuoteSent => [
                'quote_id' => $event->quote->id,
                'code' => $event->quote->code,
                'customer_id' => $event->quote->customer_id,
                'sent_by' => $event->metadata['user_id'] ?? null,
            ],
            $event instanceof QuoteApproved => [
                'quote_id' => $event->quote->id,
                'code' => $event->quote->code,
                'total_amount' => $event->quote->total_amount,
                'approved_by' => $event->metadata['approved_by'] ?? null,
            ],
            $event instanceof QuoteRejected => [
                'quote_id' => $event->quote->id,
                'code' => $event->quote->code,
                'rejected_by' => $event->metadata['rejected_by'] ?? null,
            ],
            $event instanceof QuoteDeleted => [
                'quote_id' => $event->quote->id,
                'code' => $event->quote->code,
                'deleted_by' => $event->metadata['user_id'] ?? null,
            ],
            $event instanceof QuoteConvertedToSite => [
                'quote_id' => $event->quote->id,
                'code' => $event->quote->code,
                'site_id' => $event->metadata['site_id'] ?? null,
                'converted_by' => $event->metadata['user_id'] ?? null,
            ],
        };

        Log::info("Quote {$action}", $data);
    }
}
