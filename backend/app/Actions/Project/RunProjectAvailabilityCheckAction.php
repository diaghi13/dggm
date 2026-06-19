<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectAvailabilityCheck;
use App\Domains\Project\Models\ProjectAvailabilityCheckItem;
use App\Domains\Warehouse\Queries\Inventory\GetAvailableQuantityForDateRangeQuery;
use App\Events\ProjectAvailabilityCheckCompleted;
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

            $startDate = $project->start_date?->format('Y-m-d') ?? now()->format('Y-m-d');
            $endDate = $project->estimated_end_date?->format('Y-m-d');

            foreach ($materials as $material) {
                $availableQty = (new GetAvailableQuantityForDateRangeQuery(
                    productId: $material->product_id,
                    startDate: $startDate,
                    endDate: $endDate,
                ))->execute();

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
