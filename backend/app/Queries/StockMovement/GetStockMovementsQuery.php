<?php

namespace App\Queries\StockMovement;

use App\Enums\StockMovementType;
use App\Models\StockMovement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class GetStockMovementsQuery
{
    public function __construct(
        private ?int $productId = null,
        private ?int $warehouseId = null,
        private ?int $siteId = null,
        private ?StockMovementType $type = null,
        private ?string $dateFrom = null,
        private ?string $dateTo = null,
        private ?string $search = null,
        private int $perPage = 20,
    ) {}

    public function execute(): LengthAwarePaginator
    {
        $query = StockMovement::query()
            ->with([
                'product.category',
                'warehouse',
                'fromWarehouse',
                'toWarehouse',
                'site',
                'supplier',
                'user',
                'ddt',
            ]);

        if ($this->productId) {
            $query->where('product_id', $this->productId);
        }

        if ($this->warehouseId) {
            $query->where(function ($q) {
                $q->where('warehouse_id', $this->warehouseId)
                    ->orWhere('from_warehouse_id', $this->warehouseId)
                    ->orWhere('to_warehouse_id', $this->warehouseId);
            });
        }

        if ($this->siteId) {
            $query->where('site_id', $this->siteId);
        }

        if ($this->type) {
            $query->where('type', $this->type);
        }

        if ($this->dateFrom) {
            $query->where('movement_date', '>=', $this->dateFrom);
        }

        if ($this->dateTo) {
            $query->where('movement_date', '<=', $this->dateTo);
        }

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('code', 'like', "%{$this->search}%")
                    ->orWhere('reference_document', 'like', "%{$this->search}%")
                    ->orWhere('notes', 'like', "%{$this->search}%");
            });
        }

        return $query->orderBy('movement_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($this->perPage);
    }
}
