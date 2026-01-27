<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

readonly class GetLowStockItemsQuery
{
    public function __construct(
        private ?int $warehouseId = null
    ) {}

    public function execute(): Collection
    {
        $query = Inventory::query()
            ->whereRaw('quantity_available <= minimum_stock')
            ->with(['product.category', 'warehouse'])
            ->orderBy('quantity_available', 'asc');

        if ($this->warehouseId) {
            $query->where('warehouse_id', $this->warehouseId);
        }

        return $query->get();
    }
}
