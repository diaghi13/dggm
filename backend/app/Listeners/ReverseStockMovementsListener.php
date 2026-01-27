<?php

namespace App\Listeners;

use App\Events\DdtCancelled;
use App\Events\StockMovementReversed;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ReverseStockMovementsListener
 *
 * CRITICAL LISTENER - Reverses all stock movements when a DDT is cancelled.
 *
 * Must run synchronously (NOT queued) to ensure movements are reversed before response.
 */
class ReverseStockMovementsListener
{
    public function handle(DdtCancelled $event): void
    {
        $ddt = $event->ddt->fresh(['stockMovements.product', 'stockMovements.warehouse']);

        DB::transaction(function () use ($ddt, $event) {
            foreach ($ddt->stockMovements as $movement) {
                // Reverse inventory changes
                $this->reverseInventoryChange($movement);

                // Mark movement as cancelled (or delete if you prefer)
                $movement->update([
                    'notes' => ($movement->notes ?? '') . "\nCANCELLED: {$event->reason}",
                ]);

                Log::info('Stock movement reversed', [
                    'movement_id' => $movement->id,
                    'movement_code' => $movement->code,
                    'ddt_id' => $ddt->id,
                    'reason' => $event->reason,
                ]);
            }

            Log::info('All stock movements reversed for DDT', [
                'ddt_id' => $ddt->id,
                'ddt_code' => $ddt->code,
                'movements_count' => $ddt->stockMovements->count(),
                'reason' => $event->reason,
            ]);
        });
    }

    /**
     * Reverse inventory changes based on movement type
     */
    private function reverseInventoryChange($movement): void
    {
        $inventory = Inventory::where('product_id', $movement->product_id)
            ->where('warehouse_id', $movement->warehouse_id)
            ->first();

        if (! $inventory) {
            Log::warning('Inventory not found for reversal', [
                'product_id' => $movement->product_id,
                'warehouse_id' => $movement->warehouse_id,
                'movement_id' => $movement->id,
            ]);

            return;
        }

        // Reverse based on movement type
        if ($movement->type->isIncoming()) {
            // Was added, now remove
            $inventory->quantity_available -= $movement->quantity;
        } elseif ($movement->type->isOutgoing()) {
            // Was removed, now add back
            $inventory->quantity_available += $movement->quantity;
        }

        $inventory->save();
    }
}
