<?php

namespace App\Domains\Warehouse\Actions\Inventory;

use App\Domains\Warehouse\Models\InventoryReservation;
use App\Domains\Warehouse\Queries\Inventory\GetAvailableQuantityForDateRangeQuery;
use App\Enums\InventoryReservationStatus;
use App\Enums\InventoryReservationType;
use Illuminate\Support\Facades\DB;

class CreateInventoryReservationAction
{
    public function execute(
        int $productId,
        float $quantity,
        string $startDate,
        InventoryReservationType $type,
        InventoryReservationStatus $status = InventoryReservationStatus::Confirmed,
        ?string $endDate = null,
        ?int $warehouseId = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $notes = null,
    ): InventoryReservation {
        return DB::transaction(function () use ($productId, $quantity, $startDate, $endDate, $type, $status, $warehouseId, $referenceType, $referenceId, $notes) {
            // Only validate availability when the reservation actually blocks stock
            if ($status->blocksAvailability()) {
                $available = (new GetAvailableQuantityForDateRangeQuery(
                    productId: $productId,
                    startDate: $startDate,
                    endDate: $endDate,
                    warehouseId: $warehouseId,
                ))->execute();

                if ($available < $quantity) {
                    throw new \Exception(
                        "Disponibilità insufficiente per il periodo selezionato. Disponibili: {$available}, richiesti: {$quantity}."
                    );
                }
            }

            $reservation = InventoryReservation::create([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'quantity' => $quantity,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'type' => $type,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'status' => $status,
                'notes' => $notes,
            ]);

            return $reservation->fresh(['product', 'warehouse']);
        });
    }
}
