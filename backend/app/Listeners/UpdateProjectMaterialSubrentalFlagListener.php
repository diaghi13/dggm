<?php

namespace App\Listeners;

use App\Events\AvailabilityItemResolved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class UpdateProjectMaterialSubrentalFlagListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(AvailabilityItemResolved $event): void
    {
        $item = $event->item;

        if ($item->resolution?->value !== 'subrental') {
            return;
        }

        Log::info('Availability item resolved as subrental', [
            'item_id' => $item->id,
            'project_material_id' => $item->project_material_id,
            'subrental_supplier_id' => $item->subrental_supplier_id,
            'subrental_estimated_cost' => $item->subrental_estimated_cost,
        ]);

        // TODO: update project_material with subrental flag when the field is added in a future step
    }
}
