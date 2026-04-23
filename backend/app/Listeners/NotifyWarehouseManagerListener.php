<?php

namespace App\Listeners;

use App\Events\DdtCancelled;
use App\Events\DdtConfirmed;
use App\Events\DdtDelivered;
use App\Events\MaterialIncidentReported;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * NotifyWarehouseManagerListener
 *
 * Sends notifications to warehouse manager for important DDT events
 * and material incident reports. Queued for performance.
 */
class NotifyWarehouseManagerListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(DdtConfirmed|DdtCancelled|DdtDelivered|MaterialIncidentReported $event): void
    {
        if ($event instanceof MaterialIncidentReported) {
            $incident = $event->incident;

            // TODO: Implement actual notification (email, push, etc.)
            Log::info('Warehouse manager notified: material incident reported', [
                'incident_id' => $incident->id,
                'project_id' => $incident->project_id,
                'incident_type' => $incident->incident_type->value,
                'is_chargeable_to_client' => $incident->is_chargeable_to_client,
            ]);

            return;
        }

        $action = match (true) {
            $event instanceof DdtConfirmed => 'confirmed',
            $event instanceof DdtCancelled => 'cancelled',
            $event instanceof DdtDelivered => 'delivered',
        };

        // TODO: Implement actual notification (email, push, etc.)
        Log::info("Warehouse manager notified: DDT {$action}", [
            'ddt_id' => $event->ddt->id,
            'ddt_code' => $event->ddt->code,
            'ddt_type' => $event->ddt->type->value,
            'warehouse_id' => $event->ddt->from_warehouse_id,
        ]);
    }
}
