<?php

namespace App\Domains\Warehouse\Queries;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Collection;

/**
 * GetLowStockWarehousesQuery
 *
 * Query per trovare tutti i warehouse che hanno prodotti sotto scorta minima.
 * Utile per dashboard, alert, report.
 */
class GetLowStockWarehousesQuery
{
    /**
     * Esegue la query
     */
    public function execute(): Collection
    {
        return Warehouse::query()
            ->with(['manager'])
            ->whereHas('inventory', function ($query) {
                // Ha almeno un item con stock basso
                $query->whereRaw('quantity_available <= minimum_stock');
            })
            ->withCount([
                'inventory as low_stock_items_count' => function ($query) {
                    $query->whereRaw('quantity_available <= minimum_stock');
                },
            ])
            ->where('is_active', true)
            ->orderByDesc('low_stock_items_count')
            ->get();
    }

    /**
     * Variante: ottieni warehouse con numero minimo di low stock items
     */
    public function executeWithMinimum(int $minimumLowStockItems = 1): Collection
    {
        return Warehouse::query()
            ->with(['manager'])
            ->whereHas('inventory', function ($query) {
                $query->whereRaw('quantity_available <= minimum_stock');
            })
            ->withCount([
                'inventory as low_stock_items_count' => function ($query) {
                    $query->whereRaw('quantity_available <= minimum_stock');
                },
            ])
            ->where('is_active', true)
            ->having('low_stock_items_count', '>=', $minimumLowStockItems)
            ->orderByDesc('low_stock_items_count')
            ->get();
    }
}
