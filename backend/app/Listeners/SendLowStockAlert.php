<?php

namespace App\Listeners;

use App\Events\InventoryLowStock;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendLowStockAlert implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(InventoryLowStock $event): void
    {
        // Invia email/notifica
        \Log::info('Low stock alert sent', [
            'warehouse' => $event->warehouse->name,
            'product' => $event->inventory->product->name ?? 'Unknown',
        ]);
    }
}
