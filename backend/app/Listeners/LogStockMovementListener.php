<?php

namespace App\Listeners;

use App\Events\StockMovementCreated;
use App\Events\StockMovementReversed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * LogStockMovementListener
 *
 * Logs stock movements (created and reversed) for audit trail.
 * Queued for performance.
 */
class LogStockMovementListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(StockMovementCreated|StockMovementReversed $event): void
    {
        if ($event instanceof StockMovementCreated) {
            Log::info('Stock movement created', [
                'movement_id' => $event->movement->id,
                'code' => $event->movement->code,
                'product_id' => $event->movement->product_id,
                'warehouse_id' => $event->movement->warehouse_id,
                'type' => $event->movement->type->value,
                'quantity' => $event->movement->quantity,
                'ddt_id' => $event->movement->ddt_id,
            ]);
        } else {
            Log::info('Stock movement reversed', [
                'original_movement_id' => $event->originalMovement->id,
                'reversing_movement_id' => $event->reversingMovement->id,
                'reason' => $event->reason,
            ]);
        }
    }
}
