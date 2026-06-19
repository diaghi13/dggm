<?php

namespace App\Listeners;

use App\Domains\Product\Events\ProductCostUpdated;
use App\Jobs\RecalculateCompositePricesJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * UpdateCompositePricesFromComponentListener
 *
 * When a product's cost changes (ProductCostUpdated event), dispatch a job to
 * recalculate prices for all composite products that contain it as a component.
 *
 * Runs asynchronously via queue to avoid blocking the request that triggered
 * the cost change.
 */
class UpdateCompositePricesFromComponentListener implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    public int $timeout = 30;

    public function handle(ProductCostUpdated $event): void
    {
        $product = $event->product;

        Log::info('UpdateCompositePricesFromComponentListener: dispatching composite recalculation', [
            'component_product_id' => $product->id,
            'component_code' => $product->code,
            'trigger' => $event->metadata['trigger'] ?? 'unknown',
        ]);

        RecalculateCompositePricesJob::dispatch($product->id);
    }
}
