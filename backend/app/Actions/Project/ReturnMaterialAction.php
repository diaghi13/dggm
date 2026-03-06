<?php

namespace App\Actions\Project;

use App\Enums\ProjectMaterialStatus;
use App\Models\ProjectMaterial;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ReturnMaterialAction
{
    public function execute(ProjectMaterial $projectMaterial, float $quantity): ProjectMaterial
    {
        return DB::transaction(function () use ($projectMaterial, $quantity) {
            $maxReturn = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;

            if ($quantity > $maxReturn) {
                throw new InvalidArgumentException(
                    "Cannot return more than delivered quantity. Maximum returnable quantity is {$maxReturn}."
                );
            }

            $projectMaterial->returned_quantity += $quantity;
            $projectMaterial->used_quantity = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;

            // Recalculate status based on net quantity
            $netQuantity = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;
            $planned = $projectMaterial->planned_quantity;

            if ($netQuantity == 0) {
                $projectMaterial->status = ProjectMaterialStatus::RETURNED;
            } elseif ($netQuantity < $planned) {
                $projectMaterial->status = ProjectMaterialStatus::DELIVERED;
            } else {
                $projectMaterial->status = ProjectMaterialStatus::COMPLETED;
            }

            $projectMaterial->save();

            return $projectMaterial->fresh(['product']);
        });
    }
}
