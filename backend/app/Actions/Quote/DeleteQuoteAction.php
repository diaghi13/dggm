<?php

namespace App\Actions\Quote;

use App\Events\QuoteDeleted;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;

class DeleteQuoteAction
{
    public function execute(Quote $quote): bool
    {
        if (! $quote->canBeHardDeleted()) {
            throw new \RuntimeException($quote->deletionBlockReason());
        }

        return DB::transaction(function () use ($quote) {
            // If deleting the current revision, promote the previous version
            if ($quote->is_current_version && $quote->original_quote_id) {
                $originalId = $quote->original_quote_id;

                $previousVersion = Quote::where(function ($q) use ($originalId) {
                    $q->where('id', $originalId)
                        ->orWhere('original_quote_id', $originalId);
                })
                    ->where('version', '<', $quote->version)
                    ->orderByDesc('version')
                    ->first();

                if ($previousVersion) {
                    $previousVersion->update(['is_current_version' => true]);
                }
            }

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
