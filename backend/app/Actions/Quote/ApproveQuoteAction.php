<?php

namespace App\Actions\Quote;

use App\Events\QuoteApproved;
use App\Models\Quote;

class ApproveQuoteAction
{
    public function execute(Quote $quote): Quote
    {
        $quote->approve(); // Uses existing method

        QuoteApproved::dispatch($quote, [
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return $quote->fresh(['items', 'customer', 'projectManager']);
    }
}
