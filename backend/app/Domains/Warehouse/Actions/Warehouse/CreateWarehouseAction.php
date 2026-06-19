<?php

namespace App\Domains\Warehouse\Actions\Warehouse;

use App\Domains\Warehouse\Data\WarehouseData;
use App\Domains\Warehouse\Models\Warehouse;
use App\Events\WarehouseCreated;
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
            // Create warehouse code if needed
            if (empty($warehouse->code)) {
                $count = Warehouse::count() + 1;
                $data->code = 'WH-'.str_pad($count, 3, '0', STR_PAD_LEFT);
            }

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
