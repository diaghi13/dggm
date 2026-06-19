<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectMaterial;
use App\Enums\ProjectMaterialStatus;
use Illuminate\Support\Facades\DB;

class ReserveMaterialAction
{
    public function execute(ProjectMaterial $projectMaterial, float $quantity, int $warehouseId): ProjectMaterial
    {
        return DB::transaction(function () use ($projectMaterial, $quantity) {
            $projectMaterial->allocated_quantity += $quantity;
            $projectMaterial->status = ProjectMaterialStatus::RESERVED;
            $projectMaterial->save();

            return $projectMaterial->fresh(['product']);
        });
    }
}
