<?php

namespace App\Listeners;

use App\Enums\DdtType;
use App\Enums\ProjectMaterialStatus;
use App\Events\DdtDelivered;
use App\Models\ProjectMaterial;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * UpdateProjectMaterialQuantitiesListener
 *
 * CRITICAL LISTENER - Updates project_materials table when outgoing DDT to a project is delivered.
 *
 * Must run synchronously (NOT queued) to ensure project inventory is updated before response.
 *
 * NOTE: Uses `product_id` (not `material_id`) and `delivered_quantity` (not `quantity_delivered`)
 * to match the actual project_materials schema.
 */
class UpdateProjectMaterialQuantitiesListener
{
    public function handle(DdtDelivered $event): void
    {
        $ddt = $event->ddt->fresh(['items.product']);

        // Only process DDTs linked to a project (outgoing deliveries and returns from customer)
        $isOutgoing = $ddt->type === DdtType::Outgoing;
        $isReturnFromCustomer = $ddt->type === DdtType::ReturnFromCustomer;

        if (! ($isOutgoing || $isReturnFromCustomer) || ! $ddt->project_id) {
            return;
        }

        DB::transaction(function () use ($ddt, $isOutgoing, $isReturnFromCustomer) {
            foreach ($ddt->items as $item) {
                if (! $item->product_id) {
                    continue;
                }

                if ($isOutgoing) {
                    // Increase delivered_quantity
                    ProjectMaterial::updateOrCreate(
                        [
                            'project_id' => $ddt->project_id,
                            'product_id' => $item->product_id,
                        ],
                        [
                            'delivered_quantity' => DB::raw("COALESCE(delivered_quantity, 0) + {$item->quantity}"),
                            'status' => ProjectMaterialStatus::DELIVERED->value,
                        ]
                    );

                    Log::info('Project material updated after DDT delivery', [
                        'project_id' => $ddt->project_id,
                        'product_id' => $item->product_id,
                        'quantity_added' => $item->quantity,
                        'ddt_code' => $ddt->code,
                    ]);
                } elseif ($isReturnFromCustomer) {
                    // Decrease delivered_quantity (material returned from project/customer)
                    $material = ProjectMaterial::where('project_id', $ddt->project_id)
                        ->where('product_id', $item->product_id)
                        ->first();

                    if ($material) {
                        $newDelivered = max(0, $material->delivered_quantity - $item->quantity);
                        $material->update(['delivered_quantity' => $newDelivered]);

                        Log::info('Project material updated after DDT return from customer', [
                            'project_id' => $ddt->project_id,
                            'product_id' => $item->product_id,
                            'quantity_returned' => $item->quantity,
                            'ddt_code' => $ddt->code,
                        ]);
                    }
                }
            }

            Log::info('Project materials updated for delivered DDT', [
                'ddt_id' => $ddt->id,
                'ddt_code' => $ddt->code,
                'project_id' => $ddt->project_id,
                'items_count' => $ddt->items->count(),
            ]);
        });
    }
}
