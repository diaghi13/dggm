<?php

namespace App\Domains\Warehouse\Actions\Warehouse;

use App\Data\CreateRepairOrderData;
use App\Domains\Warehouse\Models\Inventory;
use App\Events\RepairOrderCreated;
use App\Models\RepairOrder;
use Illuminate\Support\Facades\DB;

class CreateRepairOrderAction
{
    public function execute(CreateRepairOrderData $data): RepairOrder
    {
        return DB::transaction(function () use ($data) {
            $inventory = Inventory::findOrFail($data->inventory_id);

            // Ensure item is in quarantine — move if not already there
            if ($inventory->quantity_quarantine < $data->quantity) {
                $inventory->moveToQuarantine($data->quantity);
                $inventory->refresh();
            }

            // Set quarantine tracking fields if not already set
            $quarantineUpdates = [];

            if ($data->quarantine_reason !== null) {
                $quarantineUpdates['quarantine_reason'] = $data->quarantine_reason;
            } elseif ($inventory->quarantine_reason === null) {
                $quarantineUpdates['quarantine_reason'] = 'Repair order created';
            }

            if ($inventory->quarantine_since === null) {
                $quarantineUpdates['quarantine_since'] = today();
            }

            if (! empty($quarantineUpdates)) {
                $inventory->update($quarantineUpdates);
            }

            $repairOrder = RepairOrder::create([
                'product_id' => $data->product_id,
                'inventory_id' => $data->inventory_id,
                'incident_id' => $data->incident_id,
                'inspection_item_id' => $data->inspection_item_id,
                'repair_type' => $data->repair_type,
                'supplier_id' => $data->supplier_id,
                'quantity' => $data->quantity,
                'expected_return_date' => $data->expected_return_date,
                'status' => 'pending',
                'created_by_user_id' => auth()->id(),
            ]);

            RepairOrderCreated::dispatch($repairOrder);

            return $repairOrder->load('product', 'supplier', 'inventory');
        });
    }
}
