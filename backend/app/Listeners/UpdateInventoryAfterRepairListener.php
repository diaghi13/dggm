<?php

namespace App\Listeners;

use App\Events\RepairOrderStatusUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class UpdateInventoryAfterRepairListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(RepairOrderStatusUpdated $event): void
    {
        $repairOrder = $event->repairOrder;
        $oldStatus = $event->oldStatus;

        Log::info('Repair order status updated', [
            'repair_order_id' => $repairOrder->id,
            'product_id' => $repairOrder->product_id,
            'old_status' => $oldStatus->value,
            'new_status' => $repairOrder->status->value,
        ]);

        // TODO: Send status-change notifications to warehouse managers and project managers
    }
}
