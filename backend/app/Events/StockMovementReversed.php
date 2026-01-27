<?php

namespace App\Events;

use App\Models\StockMovement;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * StockMovementReversed Event
 *
 * Triggered when a stock movement is reversed/cancelled.
 *
 * Listeners:
 * - LogStockMovementListener - Audit trail for movement reversals
 */
class StockMovementReversed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly StockMovement $originalMovement,
        public readonly StockMovement $reversingMovement,
        public readonly string $reason
    ) {}
}
