<?php

namespace App\Domains\Warehouse\Queries\Warehouse;

use App\Domains\Warehouse\Models\Inventory;
use Illuminate\Support\Collection;

class GetQuarantinedInventoryQuery
{
    public function execute(): Collection
    {
        return Inventory::where('quantity_quarantine', '>', 0)
            ->with([
                'product:id,name,code,unit',
                'repairOrders' => fn ($q) => $q->whereNotIn('status', ['completed', 'unrepairable']),
            ])
            ->get()
            ->map(function (Inventory $inv) {
                $activeRepair = $inv->repairOrders->first();

                return [
                    'inventory_id' => $inv->id,
                    'product_id' => $inv->product_id,
                    'product_name' => $inv->product?->name,
                    'product_code' => $inv->product?->code,
                    'warehouse_id' => $inv->warehouse_id,
                    'quantity_quarantine' => (float) $inv->quantity_quarantine,
                    'quarantine_reason' => $inv->quarantine_reason,
                    'quarantine_since' => $inv->quarantine_since?->format('Y-m-d'),
                    'days_in_quarantine' => $inv->quarantine_since
                        ? (int) $inv->quarantine_since->diffInDays(now())
                        : null,
                    'repair_order_status' => $activeRepair?->status,
                    'repair_order_id' => $activeRepair?->id,
                ];
            });
    }
}
