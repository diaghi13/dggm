<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectMaterial;
use App\Enums\ProjectMaterialStatus;
use Illuminate\Support\Facades\DB;

class DeliverMaterialAction
{
    public function execute(ProjectMaterial $projectMaterial, float $quantity, ?string $deliveryDate = null): ProjectMaterial
    {
        return DB::transaction(function () use ($projectMaterial, $quantity, $deliveryDate) {
            $projectMaterial->delivered_quantity += $quantity;
            $projectMaterial->delivery_date = $deliveryDate ?? now()->toDateString();

            // Recalculate status based on net delivered quantity
            $netQuantity = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;
            $planned = $projectMaterial->planned_quantity;

            if ($netQuantity == 0) {
                $projectMaterial->status = ProjectMaterialStatus::PLANNED;
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
