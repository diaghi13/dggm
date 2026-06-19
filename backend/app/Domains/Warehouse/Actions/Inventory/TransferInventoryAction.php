<?php

namespace App\Domains\Warehouse\Actions\Inventory;

use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;
use Illuminate\Support\Facades\DB;

class TransferInventoryAction
{
    public function execute(
        int $productId,
        int $fromWarehouseId,
        int $toWarehouseId,
        float $quantity,
        ?float $unitCost = null,
        ?string $notes = null,
        ?string $referenceDocument = null,
    ): StockMovement {
        return DB::transaction(function () use ($productId, $fromWarehouseId, $toWarehouseId, $quantity, $unitCost, $notes, $referenceDocument) {
            $source = Inventory::where('product_id', $productId)
                ->where('warehouse_id', $fromWarehouseId)
                ->lockForUpdate()
                ->firstOrFail();

            $physicallyAvailable = $source->quantity_available
                - $source->quantity_out_on_rental
                - $source->quantity_quarantine
                - $source->quantity_in_transit;

            if ($physicallyAvailable < $quantity) {
                throw new \Exception(
                    "Disponibilità insufficiente nel magazzino di origine: {$physicallyAvailable}, richiesti: {$quantity}."
                );
            }

            // Move fleet between warehouses: decrement source, increment destination
            $source->quantity_available -= $quantity;
            $source->save();

            $destination = Inventory::firstOrCreate(
                ['product_id' => $productId, 'warehouse_id' => $toWarehouseId],
                ['quantity_available' => 0, 'quantity_reserved' => 0, 'quantity_in_transit' => 0, 'quantity_quarantine' => 0, 'quantity_out_on_rental' => 0],
            );
            $destination->quantity_available += $quantity;
            $destination->save();

            $shared = [
                'product_id' => $productId,
                'from_warehouse_id' => $fromWarehouseId,
                'to_warehouse_id' => $toWarehouseId,
                'type' => StockMovementType::TRANSFER,
                'quantity' => $quantity,
                'unit_cost' => $unitCost ?? 0,
                'movement_date' => now(),
                'user_id' => auth()->id(),
                'notes' => $notes,
                'reference_document' => $referenceDocument,
            ];

            $movementOut = StockMovement::create([...$shared, 'warehouse_id' => $fromWarehouseId]);
            $movementIn = StockMovement::create([...$shared, 'warehouse_id' => $toWarehouseId]);

            StockMovementCreated::dispatch($movementOut);
            StockMovementCreated::dispatch($movementIn);

            return $movementOut->fresh(['product', 'warehouse', 'user']);
        });
    }
}
