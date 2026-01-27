<?php

namespace App\Actions\Ddt;

use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Events\DdtConfirmed;
use App\Models\Ddt;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

class ConfirmDdtAction
{
    public function execute(Ddt $ddt): Ddt
    {
        if ($ddt->status !== DdtStatus::Draft) {
            throw new \Exception("Only Draft DDTs can be confirmed. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt) {
            // Validate items exist
            if ($ddt->items()->count() === 0) {
                throw new \Exception('DDT must have at least one item.');
            }

            // Validate stock availability for outgoing types
            if (in_array($ddt->type, [DdtType::Outgoing, DdtType::Internal, DdtType::RentalOut])) {
                $this->validateStockAvailability($ddt);
            }

            // Update status
            $ddt->update(['status' => DdtStatus::Issued]);

            // Dispatch event - GenerateStockMovementsListener will create movements
            DdtConfirmed::dispatch($ddt->fresh(['items.product', 'fromWarehouse', 'toWarehouse']), auth()->id());

            return $ddt->fresh(['items.product', 'stockMovements.product', 'fromWarehouse', 'toWarehouse', 'supplier', 'customer', 'site']);
        });
    }

    private function validateStockAvailability(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            $inventory = Inventory::where('product_id', $item->product_id)
                ->where('warehouse_id', $ddt->from_warehouse_id)
                ->first();

            $quantityFree = $inventory
                ? ($inventory->quantity_available - $inventory->quantity_reserved)
                : 0;

            if ($quantityFree < $item->quantity) {
                $productName = $item->product->name;
                throw new \Exception("Insufficient stock for {$productName}. Available: {$quantityFree}, Required: {$item->quantity}");
            }
        }
    }
}
