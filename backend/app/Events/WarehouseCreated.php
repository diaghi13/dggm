<?php

namespace App\Events;

use App\Models\Warehouse;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * WarehouseCreated Event
 *
 * Scatenato quando un warehouse viene creato.
 *
 * Listener possono:
 * - Inviare notifiche al manager
 * - Creare audit log
 * - Invalidare cache
 * - Inviare webhook a sistemi esterni
 * - Inizializzare configurazioni default
 */
class WarehouseCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  Warehouse  $warehouse  Il warehouse creato
     * @param  array  $metadata  Dati aggiuntivi (es: chi l'ha creato)
     */
    public function __construct(
        public readonly Warehouse $warehouse,
        public readonly array $metadata = []
    ) {}

    /**
     * Canali broadcast (per frontend real-time)
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('warehouses'),
            new PrivateChannel("warehouse.{$this->warehouse->id}"),
        ];
    }

    /**
     * Nome evento per broadcast
     */
    public function broadcastAs(): string
    {
        return 'warehouse.created';
    }

    /**
     * Dati da inviare al frontend
     */
    public function broadcastWith(): array
    {
        return [
            'warehouse_id' => $this->warehouse->id,
            'warehouse_code' => $this->warehouse->code,
            'warehouse_name' => $this->warehouse->name,
            'created_at' => $this->warehouse->created_at->toISOString(),
        ];
    }
}
