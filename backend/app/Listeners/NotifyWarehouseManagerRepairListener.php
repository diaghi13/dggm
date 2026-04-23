<?php

namespace App\Listeners;

use App\Events\RepairOrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class NotifyWarehouseManagerRepairListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(RepairOrderCreated $event): void
    {
        $repairOrder = $event->repairOrder;

        Log::info('Repair order created — warehouse manager notification pending', [
            'repair_order_id' => $repairOrder->id,
            'product_id' => $repairOrder->product_id,
            'repair_type' => $repairOrder->repair_type->value,
            'quantity' => $repairOrder->quantity,
            'status' => $repairOrder->status->value,
        ]);

        // TODO: Send notification to warehouse managers via NotificationService
    }
}
