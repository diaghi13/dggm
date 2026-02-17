<?php

namespace App\Actions\Quote;

use App\Events\QuoteDeleted;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;

class DeleteQuoteAction
{
    public function execute(Quote $quote): bool
    {
        return DB::transaction(function () use ($quote) {
            // Soft delete items
            $quote->items()->delete();

            // Dispatch event before deletion
            QuoteDeleted::dispatch($quote, [
                'user_id' => auth()->id(),
            ]);

            // Soft delete quote
            return $quote->delete();
        });
    }
}
