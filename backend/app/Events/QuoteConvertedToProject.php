<?php

namespace App\Events;

use App\Domains\Project\Models\Project;
use App\Domains\Quote\Models\Quote;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuoteConvertedToProject
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Quote $quote,
        public readonly Project $project,
        public readonly array $metadata = []
    ) {}
}
