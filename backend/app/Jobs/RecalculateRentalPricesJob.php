<?php

namespace App\Jobs;

use App\Enums\ProductType;
use App\Models\PriceListItem;
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
 * Recalculate Rental Prices Job
 *
 * Recalculates rental prices for all non-manual price list items
 * after rental curve settings (rental.*) are changed.
 *
 * Only items with is_manual_rental = false are processed.
 * Manual rental overrides (is_manual_rental = true) are never touched.
 *
 * If $rentalProfileId is provided, only items whose product's category
 * has that rental_profile_id are recalculated.
 */
class RecalculateRentalPricesJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Maximum execution time in seconds.
     */
    public int $timeout = 300;

    public function __construct(public readonly ?int $rentalProfileId = null) {}

    /**
     * Execute the job.
     */
    public function handle(RentalEngineService $engine): void
    {
        $priceCalculator = app(PriceCalculatorService::class);
        $productPricing = app(ProductPricingService::class);
        $count = 0;

        PriceListItem::query()
            ->where('is_manual_rental', false)
            ->where('is_active', true)
            ->whereHas('product', fn ($q) => $q->where('product_type', '!=', ProductType::SERVICE->value))
            ->when($this->rentalProfileId, function ($query) {
                $query->whereHas('product.category', function ($q) {
                    $q->where('rental_profile_id', $this->rentalProfileId);
                });
            })
            ->chunkById(100, function ($items) use ($engine, $priceCalculator, $productPricing, &$count) {
                foreach ($items as $item) {
                    if ($item->is_manual_rental) {
                        continue; // rispetta l'override manuale
                    }

                    $item->load('product.category.rentalProfile', 'product.suppliers', 'product.components.relatedProduct.priceListItems.priceList');
                    $product = $item->product;

                    if (! $product) {
                        continue;
                    }

                    // Composite: aggregate rental prices from components
                    if ($product->product_type === ProductType::COMPOSITE) {
                        $compositePrices = $productPricing->calculateCompositePrices($product);
                        $item->update([
                            'rental_hourly' => $compositePrices['rental_hourly'],
                            'rental_half_day' => $compositePrices['rental_half_day'],
                            'rental_daily' => $compositePrices['rental_daily'],
                            'rental_weekly' => $compositePrices['rental_weekly'],
                            'rental_monthly' => $compositePrices['rental_monthly'],
                            'rental_seasonal' => $compositePrices['rental_seasonal'],
                        ]);
                    } else {
                        // Article: use purchase cost + rental engine
                        $purchaseCost = $priceCalculator->calculateProductPurchasePrice($product);
                        $prices = $engine->calculateRentalPrices(
                            $purchaseCost,
                            $product->category?->rentalProfile,
                            null,
                            (bool) $product->is_premium
                        );
                        $item->update([
                            'rental_hourly' => $prices['hourly'],
                            'rental_half_day' => $prices['half_day'],
                            'rental_daily' => $prices['daily'],
                            'rental_weekly' => $prices['weekly'],
                            'rental_monthly' => $prices['monthly'],
                            'rental_seasonal' => $prices['seasonal'],
                        ]);
                    }

                    $count++;
                }
            });

        $scope = $this->rentalProfileId ? "profile #{$this->rentalProfileId}" : 'all profiles';
        Log::info("RecalculateRentalPricesJob: recalculated {$count} price list items ({$scope}).");

        // Phase 2: update products.estimated_base_day for all article products.
        // This ensures the autocomplete rental price estimate is accurate even for
        // products not assigned to any price list.
        $productCount = 0;

        Product::query()
            ->where('product_type', ProductType::ARTICLE->value)
            ->where('rental_price_estimated', false)
            ->when($this->rentalProfileId, function ($query) {
                $query->whereHas('category', function ($q) {
                    $q->where('rental_profile_id', $this->rentalProfileId);
                });
            })
            ->with(['suppliers' => fn ($q) => $q->wherePivot('is_active', true), 'category.rentalProfile'])
            ->chunkById(100, function ($products) use ($engine, $priceCalculator, &$productCount) {
                foreach ($products as $product) {
                    $purchaseCost = $priceCalculator->calculateProductPurchasePrice($product);

                    if ($purchaseCost <= 0) {
                        continue;
                    }

                    $prices = $engine->calculateRentalPrices(
                        $purchaseCost,
                        $product->category?->rentalProfile,
                        null,
                        (bool) $product->is_premium
                    );

                    if ($prices['daily'] > 0) {
                        $product->update(['estimated_base_day' => $prices['daily']]);
                        $productCount++;
                    }
                }
            });

        Log::info("RecalculateRentalPricesJob: updated estimated_base_day for {$productCount} products ({$scope}).");
    }
}
