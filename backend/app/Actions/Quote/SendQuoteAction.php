<?php

namespace App\Actions\Quote;

use App\Domains\Quote\Models\Quote;
use App\Domains\Quote\Models\QuoteToken;
use App\Events\QuoteSent;
use Carbon\Carbon;
use Illuminate\Support\Str;

class SendQuoteAction
{
    public function execute(Quote $quote): Quote
    {
        $quote->send(); // Uses existing method

        $token = Str::uuid()->toString();
        $expiresAt = $quote->expiry_date
            ? Carbon::parse($quote->expiry_date)->endOfDay()
            : now()->addDays(30);

        // Store token on the quote (tenant DB)
        $quote->update([
            'customer_token' => $token,
            'customer_token_expires_at' => $expiresAt,
        ]);

        // Store token mapping in central DB for O(1) public lookup
        QuoteToken::updateOrCreate(
            ['quote_id' => $quote->id, 'tenant_id' => tenant('id')],
            ['token' => $token, 'expires_at' => $expiresAt]
        );

        QuoteSent::dispatch($quote, [
            'sent_by' => auth()->id(),
            'sent_at' => now(),
        ]);

        return $quote->fresh(['items', 'customer', 'projectManager']);
    }
}
