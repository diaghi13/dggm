<?php

namespace App\Listeners;

use App\Events\BulkProductPricesUpdated;
use App\Events\PriceListGenerated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;

class InvalidatePricingCache implements ShouldQueue
{
    public int $tries = 3;

    public function handle(PriceListGenerated|BulkProductPricesUpdated $event): void
    {
        // Invalidate pricing-related caches
        Cache::tags(['price_lists', 'products', 'pricing'])->flush();
    }
}
