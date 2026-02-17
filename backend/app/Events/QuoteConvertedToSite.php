<?php

namespace App\Events;

use App\Models\Quote;
use App\Models\Site;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuoteConvertedToSite
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Quote $quote,
        public readonly Site $site,
        public readonly array $metadata = []
    ) {}
}
