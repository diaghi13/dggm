<?php

namespace App\Jobs;

use App\Enums\ProductType;
use App\Models\Product;
use App\Services\ProductPricingService;
use App\Services\RentalEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * RecalculateCompositePricesJob
 *
 * When a component product's cost or price changes, all composite products that
 * contain it as a component need their derived prices updated too.
 *
 * This job:
 * 1. Finds all composites that have the given product as a component relation
 * 2. For each composite, calls ProductPricingService::calculateCompositePrices()
 * 3. Updates the composite's standard_cost and estimated_base_day on the product row
 * 4. Updates all non-manual price list items for the composite product
 *
 * Triggered by:
 * - ProductCostUpdated event (via UpdateCompositePricesFromComponentListener)
 * - Manually when relations are changed via UpdateProductAction
 */
class RecalculateCompositePricesJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    /**
     * @param  int  $componentProductId  The product whose cost/price changed.
     */
    public function __construct(public readonly int $componentProductId) {}

    public function handle(
        ProductPricingService $pricingService,
        RentalEngineService $rentalEngine
    ): void {
        // Find all composite products that include this product as a component relation
        $compositeProducts = Product::where('product_type', ProductType::COMPOSITE)
            ->whereHas('components', function ($q) {
                $q->where('related_product_id', $this->componentProductId);
            })
            ->with([
                'components.relatedProduct.priceListItems' => function ($q) {
                    $q->where('is_active', true)
                        ->whereHas('priceList', fn ($pq) => $pq->where('is_active', true)->where('is_default', true));
                },
                'priceListItems.priceList',
            ])
            ->get();

        if ($compositeProducts->isEmpty()) {
            return;
        }

        $updated = 0;

        foreach ($compositeProducts as $composite) {
            $prices = $pricingService->calculateCompositePrices($composite);

            if ($prices['components_count'] === 0) {
                continue;
            }

            // Update product-level fields only if NOT manually overridden
            $productUpdates = [];

            // standard_cost always synced from components for composites
            $productUpdates['standard_cost'] = $prices['standard_cost'];

            // estimated_base_day: only update if not manually set (rental_price_estimated = false)
            if (! $composite->rental_price_estimated && $prices['estimated_base_day'] > 0) {
                $productUpdates['estimated_base_day'] = $prices['estimated_base_day'];
            }

            $composite->update($productUpdates);

            // Update non-manual price list items
            foreach ($composite->priceListItems as $item) {
                if ($item->is_manual_price && $item->is_manual_rental) {
                    continue;
                }

                $priceList = $item->priceList;

                if (! $priceList || ! $priceList->is_active) {
                    continue;
                }

                $itemUpdates = [];

                if (! $item->is_manual_price) {
                    $itemUpdates['sale_price'] = $prices['sale_price'];
                }

                if (! $item->is_manual_rental) {
                    $purchaseCost = $prices['standard_cost'];
                    $rentalPrices = $rentalEngine->calculateRentalPrices(
                        $purchaseCost,
                        null,
                        null,
                        (bool) $composite->is_premium
                    );

                    $itemUpdates['rental_hourly'] = $rentalPrices['hourly'];
                    $itemUpdates['rental_half_day'] = $rentalPrices['half_day'];
                    $itemUpdates['rental_daily'] = $rentalPrices['daily'];
                    $itemUpdates['rental_weekly'] = $rentalPrices['weekly'];
                    $itemUpdates['rental_monthly'] = $rentalPrices['monthly'];
                    $itemUpdates['rental_seasonal'] = $rentalPrices['seasonal'];
                }

                if (! empty($itemUpdates)) {
                    $item->update($itemUpdates);
                }
            }

            $updated++;

            Log::info('RecalculateCompositePricesJob: updated composite product', [
                'composite_product_id' => $composite->id,
                'composite_code' => $composite->code,
                'trigger_component_id' => $this->componentProductId,
                'new_standard_cost' => $prices['standard_cost'],
                'new_sale_price' => $prices['sale_price'],
                'new_estimated_base_day' => $prices['estimated_base_day'],
            ]);
        }

        Log::info("RecalculateCompositePricesJob: updated {$updated} composite products triggered by component #{$this->componentProductId}.");
    }
}
