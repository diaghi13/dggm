<?php

namespace App\Events;

use App\Enums\RepairOrderStatus;
use App\Models\RepairOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RepairOrderStatusUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly RepairOrder $repairOrder,
        public readonly RepairOrderStatus $oldStatus
    ) {}
}
