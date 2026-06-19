<?php

namespace App\Actions\Quote;

use App\Domains\Quote\Models\Quote;
use App\Events\QuoteDeleted;
use Illuminate\Support\Facades\DB;

class DeleteQuoteAction
{
    public function execute(Quote $quote): bool
    {
        if (! $quote->canBeHardDeleted()) {
            throw new \RuntimeException($quote->deletionBlockReason());
        }

        return DB::transaction(function () use ($quote) {
            // Hard delete items
            $quote->items()->forceDelete();

            // Dispatch event before deletion
            QuoteDeleted::dispatch($quote, [
                'user_id' => auth()->id(),
            ]);

            // Hard delete quote
            return $quote->forceDelete();
        });
    }
}
