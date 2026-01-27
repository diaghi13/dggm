<?php

namespace App\Events;

use App\Models\Inventory;
use App\Models\Warehouse;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * InventoryLowStock Event
 *
 * Scatenato quando stock di un prodotto scende sotto la soglia minima.
 *
 * Listener possono:
 * - Inviare alert al responsabile magazzino
 * - Creare ordine automatico al fornitore
 * - Notificare project manager
 * - Dashboard alert
 */
class InventoryLowStock implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Inventory $inventory,
        public readonly Warehouse $warehouse
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
        return 'inventory.low-stock';
    }

    public function broadcastWith(): array
    {
        return [
            'warehouse_id' => $this->warehouse->id,
            'warehouse_name' => $this->warehouse->name,
            'product_id' => $this->inventory->product_id,
            'product_name' => $this->inventory->product->name ?? null,
            'quantity_available' => $this->inventory->quantity_available,
            'minimum_stock' => $this->inventory->minimum_stock,
            'deficit' => $this->inventory->minimum_stock - $this->inventory->quantity_available,
        ];
    }
}
