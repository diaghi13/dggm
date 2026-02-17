<?php

namespace App\Actions\Quote;

use App\Events\QuoteSent;
use App\Models\Quote;

class SendQuoteAction
{
    public function execute(Quote $quote): Quote
    {
        $quote->send(); // Uses existing method

        QuoteSent::dispatch($quote, [
            'sent_by' => auth()->id(),
            'sent_at' => now(),
        ]);

        return $quote->fresh(['items', 'customer', 'projectManager']);
    }
}
