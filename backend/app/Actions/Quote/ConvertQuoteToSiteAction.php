<?php

namespace App\Actions\Quote;

use App\Events\QuoteConvertedToSite;
use App\Models\Quote;
use App\Models\Site;
use Illuminate\Support\Facades\DB;

class ConvertQuoteToSiteAction
{
    public function execute(Quote $quote): ?Site
    {
        if ($quote->status !== 'approved') {
            return null;
        }

        return DB::transaction(function () use ($quote) {
            $site = $quote->convertToSite(); // Uses existing method

            QuoteConvertedToSite::dispatch($quote, $site, [
                'converted_by' => auth()->id(),
                'converted_at' => now(),
            ]);

            return $site;
        });
    }
}
