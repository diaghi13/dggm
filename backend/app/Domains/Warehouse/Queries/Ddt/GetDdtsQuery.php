<?php

namespace App\Domains\Warehouse\Queries\Ddt;

use App\Domains\Warehouse\Models\Ddt;
use App\Enums\DdtStatus;
use App\Enums\DdtType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class GetDdtsQuery
{
    public function __construct(
        private ?DdtType $type = null,
        private ?DdtStatus $status = null,
        private ?int $warehouseId = null,
        private ?int $projectId = null,
        private ?int $supplierId = null,
        private ?int $customerId = null,
        private ?string $search = null,
        private string $sortBy = 'ddt_date',
        private string $sortOrder = 'desc',
        private int $perPage = 20,
    ) {}

    public function execute(): LengthAwarePaginator
    {
        $query = Ddt::query()
            ->with([
                'supplier',
                'customer',
                'project',
                'priceList',
                'fromWarehouse',
                'toWarehouse',
                'items.product',
                'createdBy',
            ]);

        if ($this->type) {
            $query->where('type', $this->type);
        }

        if ($this->status) {
            $query->where('status', $this->status);
        }

        if ($this->warehouseId) {
            $query->where(function ($q) {
                $q->where('from_warehouse_id', $this->warehouseId)
                    ->orWhere('to_warehouse_id', $this->warehouseId);
            });
        }

        if ($this->projectId) {
            $query->where('project_id', $this->projectId);
        }

        if ($this->supplierId) {
            $query->where('supplier_id', $this->supplierId);
        }

        if ($this->customerId) {
            $query->where('customer_id', $this->customerId);
        }

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('code', 'like', "%{$this->search}%")
                    ->orWhere('ddt_number', 'like', "%{$this->search}%")
                    ->orWhere('notes', 'like', "%{$this->search}%");
            });
        }

        return $query->orderBy($this->sortBy, $this->sortOrder)
            ->paginate($this->perPage);
    }
}
