<?php

namespace App\Queries\Warehouse;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Collection;

/**
 * GetWarehouseInventoryQuery
 *
 * Query class per ottenere l'inventory di un warehouse con filtri.
 * Usata quando la query è complessa e riutilizzabile.
 */
readonly class GetWarehouseInventoryQuery
{
    public function __construct(
        private Warehouse $warehouse
    ) {}

    public function execute(array $filters = []): Collection
    {
        $query = $this->warehouse->inventory()->with(['product']);

        // Filtro: low stock
        if (isset($filters['low_stock']) && filter_var($filters['low_stock'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereRaw('quantity_available <= minimum_stock');
        }

        // Filtro: search product
        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Filtro: product_id specifico
        if (isset($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        return $query->orderBy('product_id')->get();
    }
}
