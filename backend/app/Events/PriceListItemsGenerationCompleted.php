<?php

namespace App\Events;

use App\Models\PriceList;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Price List Items Generation Completed Event
 *
 * Dispatched when all batched jobs for generating price list items
 * have completed successfully.
 *
 * Can be used to:
 * - Send notifications to users
 * - Update UI via broadcasting
 * - Trigger additional processes
 */
class PriceListItemsGenerationCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly PriceList $priceList,
        public readonly array $metadata = []
    ) {}
}
