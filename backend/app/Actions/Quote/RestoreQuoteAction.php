<?php

namespace App\Actions\Quote;

use App\Domains\Quote\Models\Quote;
use App\Events\QuoteRestored;

class RestoreQuoteAction
{
    public function execute(Quote $quote): Quote
    {
        $quote->update(['status' => 'draft']);

        QuoteRestored::dispatch($quote, [
            'restored_by' => auth()->id(),
            'restored_at' => now(),
        ]);

        return $quote->fresh(['items.children', 'customer', 'projectManager', 'priceList', 'paymentTerm', 'warrantyType']);
    }
}
