<?php

namespace App\Domains\Warehouse\Actions\Inventory;

use App\Domains\Warehouse\Models\InventoryReservation;
use App\Enums\InventoryReservationStatus;
use Illuminate\Support\Facades\DB;

class CancelInventoryReservationAction
{
    public function execute(InventoryReservation $reservation): InventoryReservation
    {
        return DB::transaction(function () use ($reservation) {
            $terminal = [InventoryReservationStatus::Completed, InventoryReservationStatus::Cancelled];

            if (in_array($reservation->status, $terminal)) {
                throw new \Exception(
                    "La prenotazione non può essere annullata (stato corrente: {$reservation->status->value})."
                );
            }

            $reservation->update(['status' => InventoryReservationStatus::Cancelled]);

            return $reservation->fresh();
        });
    }
}
