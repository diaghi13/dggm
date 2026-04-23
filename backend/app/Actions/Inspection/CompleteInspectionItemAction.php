<?php

namespace App\Actions\Inspection;

use App\Data\CompleteInspectionItemData;
use App\Events\InspectionItemCompleted;
use App\Models\Inventory;
use App\Models\RentalReturnInspectionItem;
use Illuminate\Support\Facades\DB;

class CompleteInspectionItemAction
{
    public function execute(RentalReturnInspectionItem $item, CompleteInspectionItemData $data): RentalReturnInspectionItem
    {
        return DB::transaction(function () use ($item, $data) {
            $item->update([
                'condition' => $data->condition,
                'quantity_good' => $data->quantity_good,
                'quantity_damaged' => $data->quantity_damaged,
                'quantity_write_off' => $data->quantity_write_off,
                'damage_description' => $data->damage_description,
                'repair_estimate' => $data->repair_estimate,
                'action' => $data->action,
                'warehouse_id' => $data->warehouse_id,
            ]);

            // Execute stock action based on the chosen action
            $inventory = Inventory::firstOrCreate(
                ['product_id' => $item->product_id, 'warehouse_id' => $data->warehouse_id],
                ['quantity_available' => 0, 'quantity_reserved' => 0, 'quantity_quarantine' => 0]
            );

            match ($data->action->value) {
                'return_to_stock' => $inventory->addStock((float) $data->quantity_good),
                'quarantine' => $inventory->moveToQuarantine((float) ($data->quantity_damaged + $data->quantity_write_off)),
                'write_off' => $inventory->removeFromQuarantine((float) $data->quantity_write_off),
            };

            InspectionItemCompleted::dispatch($item->fresh());

            return $item->fresh()->load('product', 'warehouse');
        });
    }
}
