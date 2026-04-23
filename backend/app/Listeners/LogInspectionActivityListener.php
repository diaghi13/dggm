<?php

namespace App\Listeners;

use App\Events\RentalReturnInspectionCompleted;
use App\Events\RentalReturnInspectionStarted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * LogInspectionActivityListener
 *
 * Logs rental return inspection lifecycle events for audit trail.
 */
class LogInspectionActivityListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(RentalReturnInspectionStarted|RentalReturnInspectionCompleted $event): void
    {
        $action = match (true) {
            $event instanceof RentalReturnInspectionStarted => 'started',
            $event instanceof RentalReturnInspectionCompleted => 'completed',
        };

        Log::info("Rental return inspection {$action}", [
            'inspection_id' => $event->inspection->id,
            'ddt_id' => $event->inspection->ddt_id,
            'project_id' => $event->inspection->project_id,
            'inspected_by_user_id' => $event->inspection->inspected_by_user_id,
            'status' => $event->inspection->status->value,
        ]);
    }
}
