<?php

namespace App\Domains\Warehouse\Actions\Warehouse;

use App\Data\UpdateRepairOrderStatusData;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\RepairOrderStatus;
use App\Enums\StockMovementType;
use App\Events\RepairOrderStatusUpdated;
use App\Models\RepairOrder;
use Illuminate\Support\Facades\DB;

class UpdateRepairOrderStatusAction
{
    public function execute(RepairOrder $repairOrder, UpdateRepairOrderStatusData $data): RepairOrder
    {
        return DB::transaction(function () use ($repairOrder, $data) {
            $oldStatus = $repairOrder->status;

            $updates = ['status' => $data->status];

            if ($data->actual_return_date !== null) {
                $updates['actual_return_date'] = $data->actual_return_date;
            }

            if ($data->repair_cost !== null) {
                $updates['repair_cost'] = $data->repair_cost;
            }

            if ($data->repair_notes !== null) {
                $updates['repair_notes'] = $data->repair_notes;
            }

            if ($data->status->isTerminal()) {
                $updates['resolved_by_user_id'] = auth()->id();
            }

            $repairOrder->update($updates);

            $inventory = $repairOrder->inventory;

            if ($data->status === RepairOrderStatus::Completed) {
                // Release from quarantine back to available stock
                $inventory->releaseFromQuarantine((float) $repairOrder->quantity);
                $inventory->resolveQuarantine(auth()->id(), 'released');

                // Create INTAKE stock movement to record the repaired stock returning
                StockMovement::create([
                    'product_id' => $repairOrder->product_id,
                    'warehouse_id' => $inventory->warehouse_id,
                    'type' => StockMovementType::INTAKE,
                    'quantity' => $repairOrder->quantity,
                    'movement_date' => today(),
                    'notes' => 'Repair completed: '.($repairOrder->repair_notes ?? 'N/A'),
                    'user_id' => auth()->id(),
                ]);
            }

            if ($data->status === RepairOrderStatus::Unrepairable) {
                // Remove from quarantine (disposal — no return to stock)
                $inventory->removeFromQuarantine((float) $repairOrder->quantity);
                $inventory->resolveQuarantine(auth()->id(), 'disposed');

                // Create WASTE stock movement to record the write-off
                StockMovement::create([
                    'product_id' => $repairOrder->product_id,
                    'warehouse_id' => $inventory->warehouse_id,
                    'type' => StockMovementType::WASTE,
                    'quantity' => $repairOrder->quantity,
                    'movement_date' => today(),
                    'notes' => 'Written off as unrepairable',
                    'user_id' => auth()->id(),
                ]);

                // If linked to an incident, escalate damage severity
                if ($repairOrder->incident_id) {
                    $repairOrder->incident?->update(['damage_severity' => 'write_off']);
                }
            }

            RepairOrderStatusUpdated::dispatch($repairOrder, $oldStatus);

            return $repairOrder->fresh()->load('product', 'supplier', 'inventory');
        });
    }
}
