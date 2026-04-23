<?php

namespace App\Listeners;

use App\Events\MaterialIncidentResolved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class LogIncidentResolutionListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(MaterialIncidentResolved $event): void
    {
        $incident = $event->incident;

        Log::info('Material incident resolved', [
            'incident_id' => $incident->id,
            'project_id' => $incident->project_id,
            'incident_type' => $incident->incident_type->value,
            'resolved_by' => $incident->resolved_by_user_id,
            'charge_amount' => $incident->charge_amount,
            'is_chargeable_to_client' => $incident->is_chargeable_to_client,
        ]);
    }
}
