<?php

namespace App\Queries\Inventory;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

readonly class GetInventoryQuery
{
    public function __construct(
        private ?int $warehouseId = null,
        private ?int $productId = null,
        private ?bool $lowStock = null,
        private ?string $search = null,
    ) {}

    public function execute(): Collection
    {
        $query = Inventory::query()
            ->with(['product.category', 'warehouse']);

        if ($this->warehouseId) {
            $query->where('warehouse_id', $this->warehouseId);
        }

        if ($this->productId) {
            $query->where('product_id', $this->productId);
        }

        if ($this->lowStock) {
            $query->whereRaw('quantity_available <= minimum_stock');
        }

        if ($this->search) {
            $query->whereHas('product', function ($q) {
                $q->where('name', 'like', "%{$this->search}%")
                    ->orWhere('code', 'like', "%{$this->search}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}
