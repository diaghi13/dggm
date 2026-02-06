<?php

namespace App\Listeners;

use App\Events\PriceListGenerated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class LogPriceListGeneration implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(PriceListGenerated $event): void
    {
        Log::info('Price list generated', [
            'price_list_id' => $event->priceList->id,
            'price_list_name' => $event->priceList->name,
            'items_created' => $event->metadata['items_created'] ?? 0,
            'user_id' => $event->metadata['user_id'] ?? null,
        ]);
    }
}
