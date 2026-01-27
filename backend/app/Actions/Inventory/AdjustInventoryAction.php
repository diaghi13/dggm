<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Events\InventoryAdjusted;
use App\Events\InventoryLowStock;
use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class AdjustInventoryAction
{
    public function execute(
        int $productId,
        int $warehouseId,
        float $adjustment,
        ?float $unitCost = null,
        ?string $notes = null,
        ?string $referenceDocument = null,
    ): StockMovement {
        return DB::transaction(function () use ($productId, $warehouseId, $adjustment, $unitCost, $notes, $referenceDocument) {
            // Get or create inventory
            $inventory = Inventory::firstOrCreate([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
            ], [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
                'quantity_in_transit' => 0,
                'quantity_quarantine' => 0,
            ]);

            $oldQuantity = $inventory->quantity_available;

            // Update inventory
            $inventory->quantity_available += $adjustment;
            $inventory->save();

            // Create movement record
            $movement = StockMovement::create([
                'code' => StockMovement::generateCode(),
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::ADJUSTMENT,
                'quantity' => abs($adjustment),
                'unit_cost' => $unitCost ?? 0,
                'movement_date' => now(),
                'user_id' => auth()->id(),
                'notes' => $notes,
                'reference_document' => $referenceDocument,
            ]);

            // Dispatch events (listeners will handle side effects)
            InventoryAdjusted::dispatch(
                $inventory,
                $movement,
                $oldQuantity,
                $inventory->quantity_available,
                auth()->id()
            );

            // Check low stock and dispatch event if needed
            if ($inventory->minimum_stock && $inventory->quantity_available <= $inventory->minimum_stock) {
                InventoryLowStock::dispatch($inventory, $inventory->warehouse);
            }

            return $movement->fresh(['product', 'warehouse', 'user']);
        });
    }
}
