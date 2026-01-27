<?php

namespace App\Actions\Inventory;

use App\Events\InventoryReserved;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class ReserveInventoryAction
{
    public function execute(
        int $productId,
        int $warehouseId,
        float $quantity,
        ?int $siteId = null
    ): bool {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $siteId) {
            $inventory = Inventory::where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->lockForUpdate()
                ->firstOrFail();

            // Check availability
            $quantityFree = $inventory->quantity_available - $inventory->quantity_reserved;

            if ($quantityFree < $quantity) {
                throw new \Exception("Insufficient stock to reserve. Available: {$quantityFree}, Requested: {$quantity}");
            }

            // Reserve stock
            $inventory->quantity_reserved += $quantity;
            $inventory->save();

            // Dispatch event
            InventoryReserved::dispatch($inventory, $quantity, $siteId, auth()->id());

            return true;
        });
    }
}
