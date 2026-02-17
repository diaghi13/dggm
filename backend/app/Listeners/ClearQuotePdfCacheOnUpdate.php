<?php

namespace App\Listeners;

use App\Events\QuoteUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;

/**
 * ClearQuotePdfCacheOnUpdate
 *
 * Clears cached PDF and media files when quote is updated.
 * Queued for performance.
 */
class ClearQuotePdfCacheOnUpdate implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    /**
     * Handle the event
     */
    public function handle(QuoteUpdated $event): void
    {
        // Clear cached PDF when quote is updated
        Cache::forget("quote-pdf-{$event->quote->id}");

        // Delete old PDFs from media library (optional)
        // Uncomment if using Spatie Media Library
        // $event->quote->clearMediaCollection('pdfs');
    }
}
