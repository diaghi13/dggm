<?php

namespace App\Actions\Warehouse;

use App\Events\WarehouseDeleted;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

/**
 * DeleteWarehouseAction
 *
 * Action per eliminare un warehouse.
 * Include validazioni business (es: non eliminare se ha inventory).
 */
class DeleteWarehouseAction
{
    /**
     * Esegue l'eliminazione del warehouse
     *
     * @throws \Exception se il warehouse ha inventory
     */
    public function execute(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            // Recupera il warehouse
            $warehouse = Warehouse::findOrFail($id);

            // Business rule: non eliminare warehouse con inventory
            if ($warehouse->inventory()->exists()) {
                throw new \Exception('Cannot delete warehouse with existing inventory');
            }

            // Salva i dati prima dell'eliminazione
            $warehouseCode = $warehouse->code;
            $warehouseName = $warehouse->name;

            // Elimina usando Eloquent
            $deleted = $warehouse->delete();

            if ($deleted) {
                // Dispatch evento con i dati del warehouse eliminato
                WarehouseDeleted::dispatch(
                    $id,
                    $warehouseCode,
                    $warehouseName,
                    [
                        'user_id' => auth()->id(),
                        'ip_address' => request()->ip(),
                    ]
                );
            }

            return $deleted;
        });
    }
}
