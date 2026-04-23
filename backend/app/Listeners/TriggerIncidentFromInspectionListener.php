<?php

namespace App\Listeners;

use App\Events\InspectionItemCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * TriggerIncidentFromInspectionListener
 *
 * Triggered when an inspection item is completed with a non-good condition.
 * TODO (Step 9): Call ReportMaterialIncidentAction to create an incident automatically.
 */
class TriggerIncidentFromInspectionListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(InspectionItemCompleted $event): void
    {
        $item = $event->item;

        // Only act if condition is not good
        if ($item->condition?->value === 'good') {
            return;
        }

        Log::info('Inspection item completed with damage — incident trigger pending Step 9 implementation', [
            'inspection_item_id' => $item->id,
            'inspection_id' => $item->inspection_id,
            'product_id' => $item->product_id,
            'condition' => $item->condition?->value,
            'quantity_damaged' => $item->quantity_damaged,
            'quantity_write_off' => $item->quantity_write_off,
            // TODO (Step 9): dispatch ReportMaterialIncidentAction
        ]);
    }
}
