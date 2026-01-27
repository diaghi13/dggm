<?php

namespace App\Listeners;

use App\Events\InventoryLowStock;
use App\Events\StockMovementCreated;
use App\Models\Inventory;

/**
 * CheckLowStockAfterMovementListener
 *
 * Checks if inventory is low after a stock movement and dispatches InventoryLowStock event if needed.
 *
 * Runs synchronously (NOT queued) to immediately check stock levels.
 */
class CheckLowStockAfterMovementListener
{
    public function handle(StockMovementCreated $event): void
    {
        $movement = $event->movement;

        // Only check for outgoing movements (they decrease stock)
        if (! $movement->type->isOutgoing()) {
            return;
        }

        // Get inventory for this product in this warehouse
        $inventory = Inventory::where('product_id', $movement->product_id)
            ->where('warehouse_id', $movement->warehouse_id)
            ->with(['product', 'warehouse'])
            ->first();

        if (! $inventory) {
            return;
        }

        // Check if stock is now low
        if ($inventory->is_low_stock) {
            // Dispatch low stock event
            InventoryLowStock::dispatch($inventory, $inventory->warehouse);
        }
    }
}
