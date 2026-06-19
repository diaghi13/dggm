<?php

namespace App\Domains\Warehouse\Queries\Warehouse;

use App\Domains\Warehouse\Models\Warehouse;

readonly class GetWarehouseTotalValueQuery
{
    public function __construct(private Warehouse $warehouse) {}

    public function execute(): float
    {
        // Calcola il valore totale del magazzino sommando il valore di ogni prodotto in inventario
        return (float) ($this->warehouse->inventory()
            ->join('products', 'inventory.product_id', '=', 'products.id')
            ->selectRaw('COALESCE(SUM(inventory.quantity_available * products.standard_cost), 0) as total')
            ->value('total') ?? 0);
    }
}
