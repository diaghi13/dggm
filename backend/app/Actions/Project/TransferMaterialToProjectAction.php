<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectMaterial;
use App\Enums\ProjectMaterialStatus;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class TransferMaterialToProjectAction
{
    public function execute(ProjectMaterial $fromMaterial, Project $toProject, float $quantity, ?string $ddtNumber = null, ?string $notes = null): array
    {
        return DB::transaction(function () use ($fromMaterial, $toProject, $quantity, $ddtNumber, $notes) {
            $available = $fromMaterial->delivered_quantity - $fromMaterial->returned_quantity;

            if ($quantity > $available) {
                throw new InvalidArgumentException(
                    "Cannot transfer more than available quantity. Maximum transferable quantity is {$available}."
                );
            }

            $fromProject = $fromMaterial->project;
            $ddtLabel = $ddtNumber ? " DDT: {$ddtNumber}." : '';
            $notesLabel = $notes ? " {$notes}" : '';

            // Create new project material for destination project
            $transferredMaterial = ProjectMaterial::create([
                'project_id' => $toProject->id,
                'product_id' => $fromMaterial->product_id,
                'quote_item_id' => null,
                'is_extra' => true,
                'extra_reason' => "Trasferimento da progetto {$fromProject->name}",
                'requested_by' => auth()->id(),
                'requested_at' => now(),
                'planned_quantity' => $quantity,
                'allocated_quantity' => 0,
                'delivered_quantity' => $quantity,
                'used_quantity' => 0,
                'returned_quantity' => 0,
                'planned_unit_cost' => $fromMaterial->actual_unit_cost,
                'actual_unit_cost' => $fromMaterial->actual_unit_cost,
                'status' => ProjectMaterialStatus::DELIVERED,
                'delivery_date' => now()->toDateString(),
                'notes' => "Trasferito da {$fromProject->name}.{$ddtLabel}{$notesLabel}",
            ]);

            // Update original project material (treat as partial return)
            $fromMaterial->returned_quantity += $quantity;
            $fromMaterial->used_quantity = $fromMaterial->delivered_quantity - $fromMaterial->returned_quantity;

            // Recalculate status
            $netQuantity = $fromMaterial->delivered_quantity - $fromMaterial->returned_quantity;
            $planned = $fromMaterial->planned_quantity;

            if ($netQuantity == 0) {
                $fromMaterial->status = ProjectMaterialStatus::RETURNED;
            } elseif ($netQuantity < $planned) {
                $fromMaterial->status = ProjectMaterialStatus::DELIVERED;
            } else {
                $fromMaterial->status = ProjectMaterialStatus::COMPLETED;
            }

            $appendNote = "\n[TRASFERITO] {$quantity} a {$toProject->name}{$ddtLabel}";
            $fromMaterial->notes = ($fromMaterial->notes ?? '').$appendNote;
            $fromMaterial->save();

            return [
                'from' => $fromMaterial->fresh(['product']),
                'to' => $transferredMaterial->load('product'),
            ];
        });
    }
}
