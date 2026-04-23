<?php

namespace App\Actions\Project;

use App\Data\ResolveAvailabilityItemData;
use App\Events\AvailabilityItemResolved;
use App\Models\ProjectAvailabilityCheckItem;
use Illuminate\Support\Facades\DB;

class ResolveAvailabilityItemAction
{
    public function execute(ProjectAvailabilityCheckItem $item, ResolveAvailabilityItemData $data): ProjectAvailabilityCheckItem
    {
        return DB::transaction(function () use ($item, $data) {
            $item->update([
                'resolution' => $data->resolution,
                'subrental_supplier_id' => $data->subrental_supplier_id,
                'subrental_estimated_cost' => $data->subrental_estimated_cost,
                'resolved_at' => now(),
                'resolved_by_user_id' => auth()->id(),
            ]);

            // If remove_from_project: soft-delete the project_material
            if ($data->resolution->value === 'remove_from_project') {
                $item->projectMaterial->delete();
            }

            // Check if all items in this check are resolved (no 'none' resolution remaining)
            $check = $item->availabilityCheck;
            $allResolved = $check->items()->where('resolution', 'none')->doesntExist();

            if ($allResolved) {
                $check->update(['status' => 'resolved']);
            }

            AvailabilityItemResolved::dispatch($item);

            return $item->fresh();
        });
    }
}
