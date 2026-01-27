<?php

namespace App\Listeners;

use App\Events\DdtCancelled;
use App\Events\DdtConfirmed;
use App\Events\DdtDelivered;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * NotifyWarehouseManagerListener
 *
 * Sends notifications to warehouse manager for important DDT events.
 * Queued for performance.
 */
class NotifyWarehouseManagerListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(DdtConfirmed|DdtCancelled|DdtDelivered $event): void
    {
        $action = match (true) {
            $event instanceof DdtConfirmed => 'confirmed',
            $event instanceof DdtCancelled => 'cancelled',
            $event instanceof DdtDelivered => 'delivered',
        };

        // TODO: Implement actual notification (email, push, etc.)
        // For now, just log
        Log::info("Warehouse manager notified: DDT {$action}", [
            'ddt_id' => $event->ddt->id,
            'ddt_code' => $event->ddt->code,
            'ddt_type' => $event->ddt->type->value,
            'warehouse_id' => $event->ddt->from_warehouse_id,
        ]);
    }
}
