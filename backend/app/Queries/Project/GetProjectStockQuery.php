<?php

namespace App\Queries\Project;

use App\Models\Project;
use App\Models\ProjectMaterial;
use Illuminate\Database\Eloquent\Collection;

class GetProjectStockQuery
{
    public function __construct(private readonly Project $project) {}

    public function execute(): Collection
    {
        return ProjectMaterial::query()
            ->where('project_id', $this->project->id)
            ->where('is_consumable', false)
            ->where('delivered_quantity', '>', 0)
            ->whereRaw('(delivered_quantity - used_quantity - returned_quantity) > 0')
            ->with(['product:id,name,code,unit,is_rentable'])
            ->selectRaw('*, (delivered_quantity - used_quantity - returned_quantity) as project_stock')
            ->get();
    }
}
