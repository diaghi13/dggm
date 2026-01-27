<?php

namespace App\Actions\Inventory;

use App\Events\InventoryReservationReleased;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class ReleaseInventoryReservationAction
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

            // Release reservation
            $inventory->quantity_reserved = max(0, $inventory->quantity_reserved - $quantity);
            $inventory->save();

            // Dispatch event
            InventoryReservationReleased::dispatch($inventory, $quantity, $siteId, auth()->id());

            return true;
        });
    }
}
