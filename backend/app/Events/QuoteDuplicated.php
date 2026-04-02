<?php

namespace App\Events;

use App\Models\Quote;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuoteDuplicated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Quote $quote,
        public readonly Quote $originalQuote,
        public readonly array $metadata = []
    ) {}
}
