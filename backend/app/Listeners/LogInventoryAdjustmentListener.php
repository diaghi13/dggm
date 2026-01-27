<?php

namespace App\Listeners;

use App\Events\InventoryAdjusted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * LogInventoryAdjustmentListener
 *
 * Logs inventory adjustments for audit trail.
 * Queued for performance.
 */
class LogInventoryAdjustmentListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(InventoryAdjusted $event): void
    {
        Log::info('Inventory adjusted', [
            'inventory_id' => $event->inventory->id,
            'product_id' => $event->inventory->product_id,
            'warehouse_id' => $event->inventory->warehouse_id,
            'old_quantity' => $event->oldQuantity,
            'new_quantity' => $event->newQuantity,
            'difference' => $event->newQuantity - $event->oldQuantity,
            'movement_id' => $event->movement->id,
            'user_id' => $event->userId,
        ]);
    }
}
