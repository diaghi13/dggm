<?php

namespace App\Actions\Project;

use App\Data\ResolveAvailabilityItemData;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectAvailabilityCheckItem;
use App\Domains\Warehouse\Actions\Inventory\CreateInventoryReservationAction;
use App\Enums\AvailabilityResolution;
use App\Enums\InventoryReservationStatus;
use App\Enums\InventoryReservationType;
use App\Events\AvailabilityItemResolved;
use Illuminate\Support\Facades\DB;

class ResolveAvailabilityItemAction
{
    public function __construct(
        private readonly CreateInventoryReservationAction $createReservation,
    ) {}

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

            $check = $item->availabilityCheck;
            $project = $check->project;

            if ($data->resolution === AvailabilityResolution::RemoveFromProject) {
                $item->projectMaterial->delete();
            }

            // reserve_existing: create a date-aware reservation that blocks this stock
            // for the project's date range, preventing double-booking with other projects
            if ($data->resolution === AvailabilityResolution::ReserveExisting) {
                $this->createReservation->execute(
                    productId: $item->projectMaterial->product_id,
                    quantity: (float) $item->planned_qty,
                    startDate: $project->start_date?->format('Y-m-d') ?? now()->format('Y-m-d'),
                    endDate: $project->estimated_end_date?->format('Y-m-d'),
                    type: InventoryReservationType::ProjectMaterial,
                    status: InventoryReservationStatus::Confirmed,
                    referenceType: Project::class,
                    referenceId: $project->id,
                    notes: $data->notes,
                );
            }

            $allResolved = $check->items()->where('resolution', 'none')->doesntExist();

            if ($allResolved) {
                $check->update(['status' => 'resolved']);
            }

            AvailabilityItemResolved::dispatch($item);

            return $item->fresh();
        });
    }
}
