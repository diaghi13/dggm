<?php

namespace App\Domains\Warehouse\Actions\StockMovement;

use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\InventoryReservation;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\InventoryReservationStatus;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;
use Illuminate\Support\Facades\DB;

class RentalOutAction
{
    public function execute(
        int $productId,
        int $warehouseId,
        float $quantity,
        ?int $projectId = null,
        ?int $ddtId = null,
        ?int $reservationId = null,
        ?float $unitCost = null,
        ?string $notes = null,
        ?string $referenceDocument = null,
    ): StockMovement {
        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $projectId, $ddtId, $reservationId, $unitCost, $notes, $referenceDocument) {
            $inventory = Inventory::where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->lockForUpdate()
                ->firstOrFail();

            // Physical units currently in warehouse (Modello B: available = fleet, not physical presence)
            $physicallyHere = $inventory->quantity_available
                - $inventory->quantity_out_on_rental
                - $inventory->quantity_quarantine
                - $inventory->quantity_in_transit;

            if ($physicallyHere < $quantity) {
                throw new \Exception(
                    "Unità fisicamente disponibili in magazzino insufficienti: {$physicallyHere}, richieste: {$quantity}."
                );
            }

            // Modello B: quantity_available (fleet) does NOT change — only out_on_rental moves
            $inventory->quantity_out_on_rental += $quantity;
            $inventory->save();

            $movement = StockMovement::create([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::RENTAL_OUT,
                'quantity' => $quantity,
                'unit_cost' => $unitCost ?? 0,
                'movement_date' => now(),
                'user_id' => auth()->id(),
                'project_id' => $projectId,
                'ddt_id' => $ddtId,
                'notes' => $notes,
                'reference_document' => $referenceDocument,
            ]);

            // Transition linked reservation: confirmed → active
            if ($reservationId) {
                InventoryReservation::where('id', $reservationId)
                    ->where('status', InventoryReservationStatus::Confirmed)
                    ->update(['status' => InventoryReservationStatus::Active]);
            }

            StockMovementCreated::dispatch($movement);

            return $movement->fresh(['product', 'warehouse', 'user']);
        });
    }
}
