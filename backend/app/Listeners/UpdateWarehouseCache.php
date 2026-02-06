<?php

namespace App\Listeners;

use App\Events\WarehouseCreated;
use App\Events\WarehouseDeleted;
use App\Events\WarehouseUpdated;
use Illuminate\Support\Facades\Cache;

class UpdateWarehouseCache
{
    public function handleCreated(WarehouseCreated $event): void
    {
        Cache::forget('warehouses:all');
    }

    public function handleUpdated(WarehouseUpdated $event): void
    {
        Cache::forget("warehouse:{$event->warehouse->id}");
        Cache::forget('warehouses:all');
    }

    public function handleDeleted(WarehouseDeleted $event): void
    {
        Cache::forget("warehouse:{$event->warehouseId}");
        Cache::forget('warehouses:all');
    }

    public function subscribe($events): void
    {
        $events->listen(
            WarehouseCreated::class,
            [UpdateWarehouseCache::class, 'handleCreated']
        );

        $events->listen(
            WarehouseUpdated::class,
            [UpdateWarehouseCache::class, 'handleUpdated']
        );

        $events->listen(
            WarehouseDeleted::class,
            [UpdateWarehouseCache::class, 'handleDeleted']
        );
    }
}
