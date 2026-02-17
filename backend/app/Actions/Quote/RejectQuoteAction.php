<?php

namespace App\Actions\Quote;

use App\Events\QuoteRejected;
use App\Models\Quote;

class RejectQuoteAction
{
    public function execute(Quote $quote): Quote
    {
        $quote->reject(); // Uses existing method

        QuoteRejected::dispatch($quote, [
            'rejected_by' => auth()->id(),
            'rejected_at' => now(),
        ]);

        return $quote->fresh(['items', 'customer', 'projectManager']);
    }
}
