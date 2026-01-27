<?php

namespace App\Listeners;

use App\Events\WarehouseCreated;
use App\Events\WarehouseDeleted;
use App\Events\WarehouseUpdated;
use Illuminate\Support\Facades\Log;

/**
 * LogWarehouseActivity Listener
 *
 * Crea audit log per tutte le operazioni warehouse.
 */
class LogWarehouseActivity
{
    /**
     * Gestisce evento WarehouseCreated
     */
    public function handleCreated(WarehouseCreated $event): void
    {
        Log::info('Warehouse created', [
            'warehouse_id' => $event->warehouse->id,
            'warehouse_code' => $event->warehouse->code,
            'warehouse_name' => $event->warehouse->name,
            'user_id' => $event->metadata['user_id'] ?? null,
            'ip_address' => $event->metadata['ip_address'] ?? null,
        ]);

        // Opzionale: salva in tabella audit_logs
        // AuditLog::create([...]);
    }

    /**
     * Gestisce evento WarehouseUpdated
     */
    public function handleUpdated(WarehouseUpdated $event): void
    {
        Log::info('Warehouse updated', [
            'warehouse_id' => $event->warehouse->id,
            'changes' => $event->changes,
            'user_id' => $event->metadata['user_id'] ?? null,
        ]);
    }

    /**
     * Gestisce evento WarehouseDeleted
     */
    public function handleDeleted(WarehouseDeleted $event): void
    {
        Log::warning('Warehouse deleted', [
            'warehouse_id' => $event->warehouseId,
            'warehouse_code' => $event->warehouseCode,
            'user_id' => $event->metadata['user_id'] ?? null,
        ]);
    }

    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe($events): array
    {
        return [
            WarehouseCreated::class => 'handleCreated',
            WarehouseUpdated::class => 'handleUpdated',
            WarehouseDeleted::class => 'handleDeleted',
        ];
    }
}
