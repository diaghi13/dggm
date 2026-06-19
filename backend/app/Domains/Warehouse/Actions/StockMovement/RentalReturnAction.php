<?php

namespace App\Domains\Warehouse\Actions\StockMovement;

use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\InventoryReservation;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\InventoryReservationStatus;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;
use Illuminate\Support\Facades\DB;

class RentalReturnAction
{
    public function execute(
        int $productId,
        int $warehouseId,
        float $quantity,
        ?int $projectId = null,
        ?int $ddtId = null,
        ?int $reservationId = null,
        ?string $notes = null,
        ?string $referenceDocument = null,
    ): StockMovement {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $projectId, $ddtId, $reservationId, $notes, $referenceDocument) {
            $inventory = Inventory::where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($inventory->quantity_out_on_rental < $quantity) {
                throw new \Exception(
                    "Quantità da rientrare ({$quantity}) superiore a quella attualmente in noleggio ({$inventory->quantity_out_on_rental})."
                );
            }

            // Modello B: quantity_available (fleet) does NOT change — only out_on_rental moves back
            $inventory->quantity_out_on_rental -= $quantity;
            $inventory->save();

            $movement = StockMovement::create([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::RENTAL_RETURN,
                'quantity' => $quantity,
                'unit_cost' => 0,
                'movement_date' => now(),
                'user_id' => auth()->id(),
                'project_id' => $projectId,
                'ddt_id' => $ddtId,
                'notes' => $notes,
                'reference_document' => $referenceDocument,
            ]);

            // Transition linked reservation: active → completed
            if ($reservationId) {
                InventoryReservation::where('id', $reservationId)
                    ->where('status', InventoryReservationStatus::Active)
                    ->update(['status' => InventoryReservationStatus::Completed]);
            }

            StockMovementCreated::dispatch($movement);

            return $movement->fresh(['product', 'warehouse', 'user']);
        });
    }
}
