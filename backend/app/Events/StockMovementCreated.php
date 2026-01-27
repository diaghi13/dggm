<?php

namespace App\Events;

use App\Models\StockMovement;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * StockMovementCreated Event
 *
 * Triggered when a new stock movement is recorded.
 *
 * Listeners:
 * - CheckLowStockAfterMovementListener - Check if inventory is now low
 * - LogStockMovementListener - Audit trail for movements
 */
class StockMovementCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly StockMovement $movement
    ) {}
}
