<?php

namespace App\Actions\Project;

use App\Data\ResolveIncidentData;
use App\Domains\Project\Models\ProjectMaterialIncident;
use App\Events\MaterialIncidentResolved;
use Illuminate\Support\Facades\DB;

class ResolveIncidentAction
{
    public function execute(ProjectMaterialIncident $incident, ResolveIncidentData $data): ProjectMaterialIncident
    {
        return DB::transaction(function () use ($incident, $data) {
            $incident->update([
                'status' => 'resolved',
                'resolution_notes' => $data->resolution_notes,
                'resolved_by_user_id' => auth()->id(),
                'resolved_at' => now(),
                'charge_amount' => $data->charge_amount ?? $incident->charge_amount,
                'is_chargeable_to_client' => $data->is_chargeable_to_client ?? $incident->is_chargeable_to_client,
            ]);

            MaterialIncidentResolved::dispatch($incident);

            return $incident->fresh()->load('resolvedBy');
        });
    }
}
