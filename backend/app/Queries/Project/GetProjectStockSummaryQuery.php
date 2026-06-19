<?php

namespace App\Queries\Project;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectMaterial;

class GetProjectStockSummaryQuery
{
    public function __construct(private readonly Project $project) {}

    public function execute(): array
    {
        $materials = ProjectMaterial::query()
            ->where('project_id', $this->project->id)
            ->where('is_consumable', false)
            ->where('delivered_quantity', '>', 0)
            ->whereRaw('(delivered_quantity - used_quantity - returned_quantity) > 0')
            ->with(['product:id,name,code,unit,is_rentable,is_active'])
            ->selectRaw('*, (delivered_quantity - used_quantity - returned_quantity) as project_stock')
            ->get();

        $totalItemsOnSite = $materials->count();

        $totalValueOnSite = $materials->sum(function ($material) {
            return ((float) ($material->project_stock ?? 0)) * ((float) ($material->actual_unit_cost ?? 0));
        });

        $overdueRentalItemsCount = $materials->filter(function ($material) {
            if (! $material->product || ! $material->product->is_rentable) {
                return false;
            }

            if (! $material->required_date) {
                return false;
            }

            return now()->greaterThan($material->required_date)
                && ((float) ($material->returned_quantity ?? 0)) < ((float) ($material->delivered_quantity ?? 0));
        })->count();

        return [
            'total_items_on_site' => $totalItemsOnSite,
            'total_value_on_site' => round($totalValueOnSite, 2),
            'overdue_rental_items_count' => $overdueRentalItemsCount,
        ];
    }
}
