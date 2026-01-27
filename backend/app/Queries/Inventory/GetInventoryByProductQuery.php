<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

readonly class GetInventoryByProductQuery
{
    public function __construct(
        private int $productId
    ) {}

    public function execute(): Collection
    {
        return Inventory::where('product_id', $this->productId)
            ->with(['warehouse'])
            ->orderBy('warehouse_id')
            ->get();
    }
}
