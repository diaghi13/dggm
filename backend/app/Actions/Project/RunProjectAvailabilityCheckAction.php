<?php

namespace App\Actions\Project;

use App\Events\ProjectAvailabilityCheckCompleted;
use App\Models\Inventory;
use App\Models\Project;
use App\Models\ProjectAvailabilityCheck;
use App\Models\ProjectAvailabilityCheckItem;
use App\Services\AvailabilityCalculatorService;
use Illuminate\Support\Facades\DB;

class RunProjectAvailabilityCheckAction
{
    public function __construct(
        private readonly AvailabilityCalculatorService $calculator,
    ) {}

    public function execute(Project $project): ProjectAvailabilityCheck
    {
        return DB::transaction(function () use ($project) {
            $check = ProjectAvailabilityCheck::create([
                'project_id' => $project->id,
                'checked_by_user_id' => auth()->id(),
                'checked_at' => now(),
                'status' => 'pending',
            ]);

            $materials = $project->materials()
                ->whereNull('deleted_at')
                ->with('product')
                ->get();

            foreach ($materials as $material) {
                // Sum free stock (available - reserved) across ALL warehouses for this product
                $availableQty = (float) Inventory::where('product_id', $material->product_id)
                    ->sum(DB::raw('GREATEST(0, quantity_available - quantity_reserved)'));

                $shortage = $this->calculator->calculateShortage(
                    (float) $material->planned_quantity,
                    $availableQty
                );

                $status = $this->calculator->determineStatus(
                    (float) $material->planned_quantity,
                    $availableQty
                );

                ProjectAvailabilityCheckItem::create([
                    'check_id' => $check->id,
                    'project_material_id' => $material->id,
                    'planned_qty' => $material->planned_quantity,
                    'available_qty' => $availableQty,
                    'reserved_qty' => $material->allocated_quantity ?? 0,
                    'shortage_qty' => $shortage,
                    'availability_status' => $status,
                ]);
            }

            $check->update(['status' => 'completed']);

            ProjectAvailabilityCheckCompleted::dispatch($check);

            return $check->load('items.projectMaterial.product');
        });
    }
}
