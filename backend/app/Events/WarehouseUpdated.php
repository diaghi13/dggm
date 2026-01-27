<?php

namespace App\Events;

use App\Models\Warehouse;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * WarehouseUpdated Event
 */
class WarehouseUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Warehouse $warehouse,
        public readonly array $changes = [], // Cosa è cambiato
        public readonly array $metadata = []
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('warehouses'),
            new PrivateChannel("warehouse.{$this->warehouse->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'warehouse.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'warehouse_id' => $this->warehouse->id,
            'changes' => $this->changes,
            'updated_at' => $this->warehouse->updated_at->toISOString(),
        ];
    }
}
