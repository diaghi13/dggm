<?php

namespace App\Listeners;

use App\Events\InventoryReservationReleased;
use App\Events\InventoryReserved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * LogInventoryReservationListener
 *
 * Logs inventory reservations and releases for audit trail.
 * Queued for performance.
 */
class LogInventoryReservationListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(InventoryReserved|InventoryReservationReleased $event): void
    {
        $action = $event instanceof InventoryReserved ? 'reserved' : 'released';

        Log::info("Inventory {$action}", [
            'inventory_id' => $event->inventory->id,
            'product_id' => $event->inventory->product_id,
            'warehouse_id' => $event->inventory->warehouse_id,
            'quantity' => $event->quantity,
            'site_id' => $event->siteId,
            'user_id' => $event->userId,
        ]);
    }
}
