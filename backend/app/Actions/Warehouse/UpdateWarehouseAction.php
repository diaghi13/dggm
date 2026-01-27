<?php

namespace App\Actions\Warehouse;

use App\Data\WarehouseData;
use App\Events\WarehouseUpdated;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

/**
 * UpdateWarehouseAction
 *
 * Action per aggiornare un warehouse esistente.
 */
class UpdateWarehouseAction
{
    /**
     * Esegue l'aggiornamento del warehouse
     */
    public function execute(int $id, WarehouseData $data): Warehouse
    {
        return DB::transaction(function () use ($id, $data) {
            // Recupera il warehouse
            $warehouse = Warehouse::findOrFail($id);
            $oldData = $warehouse->toArray();

            // Aggiorna usando Eloquent
            $warehouse->update($data->except('id', 'full_address', 'total_value')->toArray());

            // Reload per avere i dati freschi
            $warehouse->refresh();

            // Calcola i cambiamenti
            $changes = $this->getChanges($oldData, $warehouse->toArray());

            // Dispatch evento con i cambiamenti
            WarehouseUpdated::dispatch($warehouse, $changes, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $warehouse;
        });
    }

    /**
     * Calcola i cambiamenti tra vecchio e nuovo warehouse
     */
    private function getChanges(array $old, array $new): array
    {
        $changes = [];

        foreach ($new as $key => $value) {
            if (! isset($old[$key]) || $old[$key] !== $value) {
                $changes[$key] = [
                    'old' => $old[$key] ?? null,
                    'new' => $value,
                ];
            }
        }

        return $changes;
    }
}
