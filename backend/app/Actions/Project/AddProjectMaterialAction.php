<?php

namespace App\Actions\Project;

use App\Enums\ProjectMaterialStatus;
use App\Models\Project;
use App\Models\ProjectMaterial;
use Illuminate\Support\Facades\DB;

class AddProjectMaterialAction
{
    public function execute(Project $project, array $data): ProjectMaterial
    {
        return DB::transaction(function () use ($project, $data) {
            // If no quote_item_id is provided, mark as extra
            $isExtra = $data['is_extra'] ?? empty($data['quote_item_id']);

            $projectMaterial = ProjectMaterial::create([
                ...$data,
                'project_id' => $project->id,
                'is_extra' => $isExtra,
                'requested_by' => $isExtra ? auth()->id() : null,
                'requested_at' => $isExtra ? now() : null,
                'allocated_quantity' => 0,
                'delivered_quantity' => 0,
                'used_quantity' => 0,
                'returned_quantity' => 0,
                'actual_unit_cost' => $data['planned_unit_cost'],
                'status' => ProjectMaterialStatus::PLANNED,
            ]);

            return $projectMaterial;
        });
    }
}
