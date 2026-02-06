<?php

namespace App\Events;

use App\Models\PriceList;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PriceListGenerated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly PriceList $priceList,
        public readonly array $metadata = []
    ) {}
}
