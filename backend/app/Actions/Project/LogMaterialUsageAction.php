<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectMaterial;
use App\Enums\ProjectMaterialStatus;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class LogMaterialUsageAction
{
    public function execute(ProjectMaterial $projectMaterial, float $quantityUsed, ?float $actualUnitCost = null, ?string $notes = null): ProjectMaterial
    {
        return DB::transaction(function () use ($projectMaterial, $quantityUsed, $actualUnitCost, $notes) {
            $newTotal = $projectMaterial->used_quantity + $quantityUsed;

            if ($newTotal > $projectMaterial->planned_quantity) {
                throw new InvalidArgumentException(
                    'Quantity used would exceed planned quantity. Maximum available: '.
                    ($projectMaterial->planned_quantity - $projectMaterial->used_quantity)
                );
            }

            $projectMaterial->used_quantity = $newTotal;

            if ($actualUnitCost !== null) {
                $projectMaterial->actual_unit_cost = $actualUnitCost;
            }

            if ($notes !== null) {
                $projectMaterial->notes = $notes;
            }

            // Update status based on usage
            if ($projectMaterial->used_quantity >= $projectMaterial->planned_quantity) {
                $projectMaterial->status = ProjectMaterialStatus::COMPLETED;
            } elseif ($projectMaterial->used_quantity > 0
                && $projectMaterial->status !== ProjectMaterialStatus::IN_USE
                && $projectMaterial->status !== ProjectMaterialStatus::COMPLETED) {
                $projectMaterial->status = ProjectMaterialStatus::IN_USE;
            }

            $projectMaterial->save();

            return $projectMaterial->fresh(['product']);
        });
    }
}
