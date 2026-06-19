<?php

namespace App\Domains\Warehouse\Queries\Warehouse;

use App\Domains\Warehouse\Models\Warehouse;
use Illuminate\Database\Eloquent\Collection;

/**
 * GetWarehousesWithLowStockQuery
 *
 * Query class per ottenere tutti i warehouse con prodotti sotto scorta minima.
 * Usata quando la query è complessa e riutilizzabile.
 */
class GetWarehousesWithLowStockQuery
{
    public function execute(): Collection
    {
        return Warehouse::whereHas('inventory', function ($query) {
            $query->whereRaw('quantity_available <= minimum_stock');
        })
            ->with(['inventory' => function ($query) {
                $query->whereRaw('quantity_available <= minimum_stock')
                    ->with('product');
            }])
            ->get();
    }
}
