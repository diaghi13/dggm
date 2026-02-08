<?php

namespace App\Listeners;

use App\Events\BulkProductPricesUpdated;
use App\Events\PriceListGenerated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;

/**
 * Invalidate Pricing Cache Listener
 *
 * Clears pricing-related caches when price lists or product prices are updated.
 * Compatible with all cache drivers (file, database, redis, memcached).
 */
class InvalidatePricingCache implements ShouldQueue
{
    public int $tries = 3;

    public function handle(PriceListGenerated|BulkProductPricesUpdated $event): void
    {
        // Check if cache driver supports tagging (redis, memcached)
        if (method_exists(Cache::getStore(), 'tags')) {
            // Use tags for efficient cache invalidation
            Cache::tags(['price_lists', 'products', 'pricing'])->flush();
        } else {
            // Fallback: flush specific keys for non-tagging drivers (file, database)
            $this->flushPricingKeys();
        }
    }

    /**
     * Flush pricing-related cache keys individually
     * Used when cache driver doesn't support tagging
     */
    private function flushPricingKeys(): void
    {
        // Common pricing cache keys to flush
        $keys = [
            'price_lists:active',
            'price_lists:default',
            'products:pricing',
            'pricing:calculations',
        ];

        foreach ($keys as $key) {
            Cache::forget($key);
        }

        // You can add more specific keys here based on your caching strategy
        // Example: Cache::forget('price_list:' . $event->priceList->id);
    }
}
