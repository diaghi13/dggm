<?php

namespace App\Listeners;

use App\Data\CreateRepairOrderData;
use App\Domains\Warehouse\Actions\Warehouse\CreateRepairOrderAction;
use App\Domains\Warehouse\Models\Inventory;
use App\Enums\InspectionItemAction;
use App\Events\RentalReturnInspectionCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * CreateRepairOrdersFromInspectionListener
 *
 * Triggered when a rental return inspection is fully finalized.
 * Creates repair orders for items flagged as quarantine or write_off.
 */
class CreateRepairOrdersFromInspectionListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 60;

    public function handle(RentalReturnInspectionCompleted $event): void
    {
        $inspection = $event->inspection->load('items.product');

        foreach ($inspection->items as $item) {
            if (! in_array($item->action, [InspectionItemAction::Quarantine, InspectionItemAction::WriteOff])) {
                continue;
            }

            if (! $item->warehouse_id) {
                Log::warning('Inspection item has no warehouse — skipping repair order creation', [
                    'inspection_item_id' => $item->id,
                    'product_id' => $item->product_id,
                ]);

                continue;
            }

            $inventory = Inventory::where('product_id', $item->product_id)
                ->where('warehouse_id', $item->warehouse_id)
                ->first();

            if (! $inventory) {
                Log::warning('No inventory record found for inspection item — skipping repair order creation', [
                    'inspection_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'warehouse_id' => $item->warehouse_id,
                ]);

                continue;
            }

            $quantity = (float) $item->quantity_damaged + (float) $item->quantity_write_off;

            if ($quantity <= 0) {
                continue;
            }

            try {
                app(CreateRepairOrderAction::class)->execute(
                    CreateRepairOrderData::from([
                        'product_id' => $item->product_id,
                        'inventory_id' => $inventory->id,
                        'inspection_item_id' => $item->id,
                        'incident_id' => $item->incident_id,
                        'repair_type' => 'internal',
                        'quantity' => $quantity,
                        'quarantine_reason' => $item->damage_description ?? 'Damaged at rental return',
                    ])
                );

                Log::info('Repair order created from inspection', [
                    'inspection_id' => $inspection->id,
                    'inspection_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'quantity' => $quantity,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to create repair order from inspection item', [
                    'inspection_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
