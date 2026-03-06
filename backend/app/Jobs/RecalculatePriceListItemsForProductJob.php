<?php

namespace App\Jobs;

use App\Enums\ProductType;
use App\Models\Product;
use App\Services\PriceCalculatorService;
use App\Services\ProductPricingService;
use App\Services\RentalEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * RecalculatePriceListItemsForProductJob
 *
 * Recalculates sale price and/or rental prices for all non-manual price list
 * items belonging to a single product, triggered after its purchase cost changes.
 *
 * Rules:
 * - is_manual_price = true  AND is_manual_rental = true  → skip entirely
 * - is_manual_price = false → recalculate sale_price via ProductPricingService
 * - is_manual_rental = false → recalculate all rental_* via RentalEngineService
 *   using the product's estimated_base_day as the base daily rate (when available)
 *
 * estimated_base_day is also recalculated here unless rental_price_estimated = true
 * (which means the user has manually fixed the base day override).
 */
class RecalculatePriceListItemsForProductJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public readonly int $productId) {}

    public function handle(
        PriceCalculatorService $priceCalculator,
        ProductPricingService $productPricing,
        RentalEngineService $rentalEngine
    ): void {
        $product = Product::with([
            'priceListItems.priceList',
            'relations.relatedProduct.priceListItems' => function ($q) {
                $q->where('is_active', true)
                    ->whereHas('priceList', fn ($pq) => $pq->where('is_active', true)->where('is_default', true));
            },
            'suppliers' => fn ($q) => $q->wherePivot('is_active', true),
        ])->find($this->productId);

        if (! $product) {
            Log::warning("RecalculatePriceListItemsForProductJob: product #{$this->productId} not found, skipping.");

            return;
        }

        $isComposite = $product->product_type === ProductType::COMPOSITE;

        if ($isComposite) {
            // Composite: derive sale price and rental prices from component aggregation.
            // calculateProductSalePrice() uses supplier purchase price which is always 0
            // for composites, so we must use calculateCompositePrices() instead.
            $compositePrices = $productPricing->calculateCompositePrices($product);
            $salePrice = $compositePrices['sale_price'];
            $estimatedBaseDay = $compositePrices['estimated_base_day'];

            // Persist recalculated estimated_base_day unless manually locked
            if (! $product->rental_price_estimated && $estimatedBaseDay > 0) {
                $product->update(['estimated_base_day' => $estimatedBaseDay]);
            } else {
                $estimatedBaseDay = (float) ($product->estimated_base_day ?? 0);
            }
        } else {
            // Article / Service: use supplier purchase price + markup
            $salePrice = $priceCalculator->calculateProductSalePrice($product);

            // 2. Calculate or retain estimated_base_day (not applicable for services)
            if ($product->product_type !== ProductType::SERVICE) {
                if (! $product->rental_price_estimated) {
                    $purchaseCost = $priceCalculator->calculateProductPurchasePrice($product);
                    $estimatedBaseDay = $rentalEngine->calculateEstimatedBaseDay(
                        $purchaseCost,
                        (bool) $product->is_premium
                    );
                    $product->update(['estimated_base_day' => $estimatedBaseDay]);
                } else {
                    // User has manually overridden the base day — honour it
                    $estimatedBaseDay = (float) ($product->estimated_base_day ?? 0);
                }
            } else {
                $estimatedBaseDay = 0.0;
            }
        }

        // 3. Recalculate non-manual price list items
        $updated = 0;

        foreach ($product->priceListItems as $item) {
            // Completely manual — never touch
            if ($item->is_manual_price && $item->is_manual_rental) {
                continue;
            }

            $priceList = $item->priceList;

            if (! $priceList || ! $priceList->is_active) {
                continue;
            }

            $updates = [];

            if (! $item->is_manual_price) {
                $updates['sale_price'] = $productPricing->calculateAutomaticPrice($product, $priceList);
            }

            if (! $item->is_manual_rental) {
                if ($product->product_type === ProductType::SERVICE) {
                    // Services are never rentable — clear all rental fields
                    $updates['rental_hourly'] = null;
                    $updates['rental_half_day'] = null;
                    $updates['rental_daily'] = null;
                    $updates['rental_weekly'] = null;
                    $updates['rental_monthly'] = null;
                    $updates['rental_seasonal'] = null;
                } elseif ($isComposite && isset($compositePrices)) {
                    // For composites use aggregated rental prices — they already account for
                    // per-component rental curves and profile overrides.
                    $updates['rental_hourly'] = $compositePrices['rental_hourly'];
                    $updates['rental_half_day'] = $compositePrices['rental_half_day'];
                    $updates['rental_daily'] = $compositePrices['rental_daily'];
                    $updates['rental_weekly'] = $compositePrices['rental_weekly'];
                    $updates['rental_monthly'] = $compositePrices['rental_monthly'];
                    $updates['rental_seasonal'] = $compositePrices['rental_seasonal'];
                } else {
                    $purchaseCost = $priceCalculator->calculateProductPurchasePrice($product);
                    $rentalPrices = $rentalEngine->calculateRentalPrices(
                        $purchaseCost,
                        null,
                        $estimatedBaseDay > 0 ? $estimatedBaseDay : null,
                        (bool) $product->is_premium
                    );

                    $updates['rental_hourly'] = $rentalPrices['hourly'];
                    $updates['rental_half_day'] = $rentalPrices['half_day'];
                    $updates['rental_daily'] = $rentalPrices['daily'];
                    $updates['rental_weekly'] = $rentalPrices['weekly'];
                    $updates['rental_monthly'] = $rentalPrices['monthly'];
                    $updates['rental_seasonal'] = $rentalPrices['seasonal'];
                }
            }

            if (! empty($updates)) {
                $item->update($updates);
                $updated++;
            }
        }

        Log::info("RecalculatePriceListItemsForProductJob: updated {$updated} price list items for product #{$this->productId}.");
    }
}
