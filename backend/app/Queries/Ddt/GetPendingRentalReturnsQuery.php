<?php

namespace App\Queries\Ddt;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Models\Ddt;
use Illuminate\Database\Eloquent\Collection;

readonly class GetPendingRentalReturnsQuery
{
    public function __construct(
        private ?int $warehouseId = null
    ) {}

    public function execute(): Collection
    {
        $query = Ddt::where('type', DdtType::RentalOut)
            ->whereIn('status', [DdtStatus::Issued, DdtStatus::InTransit, DdtStatus::Delivered])
            ->where(function ($q) {
                $q->whereNull('rental_actual_return_date')
                    ->orWhere('rental_actual_return_date', '>', now());
            })
            ->with(['items.product', 'site', 'fromWarehouse']);

        if ($this->warehouseId) {
            $query->where('from_warehouse_id', $this->warehouseId);
        }

        return $query->orderBy('rental_end_date', 'asc')->get();
    }
}
