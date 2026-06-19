<?php

namespace App\Domains\Warehouse\Queries\Inventory;

use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\InventoryReservation;
use Illuminate\Support\Facades\DB;

readonly class GetAvailableQuantityForDateRangeQuery
{
    public function __construct(
        private int $productId,
        private string $startDate,
        private ?string $endDate = null,
        private ?int $warehouseId = null,
        private ?int $excludeReservationId = null,
    ) {}

    public function execute(): float
    {
        // Base: fleet in warehouse minus units already out
        $inventoryQuery = Inventory::where('product_id', $this->productId);

        if ($this->warehouseId) {
            $inventoryQuery->where('warehouse_id', $this->warehouseId);
        }

        $baseStock = (float) $inventoryQuery->sum(
            DB::raw('GREATEST(0, quantity_available - quantity_out_on_rental - quantity_quarantine - quantity_in_transit)')
        );

        // Reservations that overlap the requested date range and block availability
        $reservationsQuery = InventoryReservation::forProduct($this->productId)
            ->active()
            ->overlappingDates($this->startDate, $this->endDate);

        if ($this->warehouseId) {
            // Count warehouse-specific reservations + product-wide reservations (warehouse_id IS NULL)
            $reservationsQuery->where(function ($q) {
                $q->where('warehouse_id', $this->warehouseId)
                    ->orWhereNull('warehouse_id');
            });
        }

        if ($this->excludeReservationId) {
            $reservationsQuery->where('id', '!=', $this->excludeReservationId);
        }

        $reservedQuantity = (float) $reservationsQuery->sum('quantity');

        return max(0.0, $baseStock - $reservedQuantity);
    }
}
