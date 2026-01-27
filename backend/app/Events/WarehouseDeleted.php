<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * WarehouseDeleted Event
 */
class WarehouseDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $warehouseId,
        public readonly string $warehouseCode,
        public readonly string $warehouseName,
        public readonly array $metadata = []
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('warehouses'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'warehouse.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'warehouse_id' => $this->warehouseId,
            'warehouse_code' => $this->warehouseCode,
            'deleted_at' => now()->toISOString(),
        ];
    }
}
