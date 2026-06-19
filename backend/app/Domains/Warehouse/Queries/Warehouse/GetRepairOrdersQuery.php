<?php

namespace App\Domains\Warehouse\Queries\Warehouse;

use App\Models\RepairOrder;
use Illuminate\Pagination\LengthAwarePaginator;

class GetRepairOrdersQuery
{
    public function __construct(
        private readonly array $filters = []
    ) {}

    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        $query = RepairOrder::query()
            ->with(['product:id,name,code', 'supplier:id,name', 'inventory', 'createdBy:id,name'])
            ->withTrashed(false);

        if (! empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (! empty($this->filters['repair_type'])) {
            $query->where('repair_type', $this->filters['repair_type']);
        }

        if (! empty($this->filters['supplier_id'])) {
            $query->where('supplier_id', $this->filters['supplier_id']);
        }

        if (! empty($this->filters['product_id'])) {
            $query->where('product_id', $this->filters['product_id']);
        }

        if (isset($this->filters['overdue']) && filter_var($this->filters['overdue'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereNotNull('expected_return_date')
                ->where('expected_return_date', '<', now())
                ->whereNotIn('status', ['completed', 'unrepairable']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }
}
