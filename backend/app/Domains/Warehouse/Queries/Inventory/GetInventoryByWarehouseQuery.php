<?php

namespace App\Domains\Warehouse\Queries\Inventory;

use App\Domains\Warehouse\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

readonly class GetInventoryByWarehouseQuery
{
    public function __construct(
        private int $warehouseId
    ) {}

    public function execute(): Collection
    {
        return Inventory::where('warehouse_id', $this->warehouseId)
            ->with(['product.category'])
            ->orderBy('product_id')
            ->get();
    }
}
