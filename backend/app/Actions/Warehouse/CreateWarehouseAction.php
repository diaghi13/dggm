<?php

namespace App\Actions\Warehouse;

use App\Data\WarehouseData;
use App\Events\WarehouseCreated;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

/**
 * CreateWarehouseAction
 *
 * Action per creare un nuovo warehouse.
 * Vantaggi del pattern Action:
 * - Single Responsibility: fa UNA sola cosa
 * - Riusabilità: può essere chiamata da Controller, Job, Command, Test
 * - Testabilità: facile da testare in isolamento
 * - Transaction safety: gestisce transazioni DB
 */
class CreateWarehouseAction
{
    /**
     * Esegue la creazione del warehouse
     */
    public function execute(WarehouseData $data): Warehouse
    {
        return DB::transaction(function () use ($data) {
            // Crea warehouse usando Eloquent
            $warehouse = Warehouse::create($data->except('id', 'full_address', 'total_value')->toArray());

            // Dispatch evento
            WarehouseCreated::dispatch($warehouse, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $warehouse;
        });
    }
}
