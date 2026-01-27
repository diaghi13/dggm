<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;

readonly class GetStockValuationQuery
{
    public function __construct(
        private ?int $warehouseId = null
    ) {}

    public function execute(): array
    {
        $query = Inventory::query()
            ->join('products', 'inventory.product_id', '=', 'products.id');

        if ($this->warehouseId) {
            $query->where('inventory.warehouse_id', $this->warehouseId);
        }

        $result = $query->selectRaw('
            SUM(inventory.quantity_available * products.standard_cost) as total_value,
            SUM(inventory.quantity_available) as total_units,
            COUNT(DISTINCT inventory.product_id) as unique_products,
            SUM(inventory.quantity_reserved) as total_reserved,
            SUM(inventory.quantity_in_transit) as total_in_transit
        ')->first();

        return [
            'total_value' => (float) ($result->total_value ?? 0),
            'total_units' => (float) ($result->total_units ?? 0),
            'unique_products' => (int) ($result->unique_products ?? 0),
            'total_reserved' => (float) ($result->total_reserved ?? 0),
            'total_in_transit' => (float) ($result->total_in_transit ?? 0),
        ];
    }
}
