<?php

namespace App\Domains\Product\Actions;

use App\Domains\Product\Models\Product;
use App\Events\BulkProductPricesUpdated;
use App\Services\PriceCalculatorService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Bulk Update Product Prices Action
 *
 * Updates prices for multiple products at once.
 *
 * Use cases:
 * - "All products +10%"
 * - "All BTicino products +3%"
 * - "Electrical category +5%"
 *
 * ARCHITECTURE RULES:
 * - Uses DB::transaction() for atomicity
 * - Dispatches Events AFTER persistence
 * - Returns array with update results
 * - NO HTTP concerns (authorization/validation in Controller)
 */
class BulkUpdateProductPricesAction
{
    public function __construct(
        private readonly PriceCalculatorService $priceCalculator
    ) {}

    /**
     * Execute bulk price update
     *
     * @param  array  $filters  Filters to select products ['brand_id' => 1, 'category_id' => 2, etc.]
     * @param  array  $adjustment  Adjustment configuration ['type' => 'percentage', 'value' => 10]
     * @return array ['updated' => int, 'products' => Collection]
     */
    public function execute(array $filters, array $adjustment): array
    {
        return DB::transaction(function () use ($filters, $adjustment) {
            $products = $this->getFilteredProducts($filters);

            $updated = 0;

            foreach ($products as $product) {
                // Calculate new manufacturer retail price
                $currentPrice = $product->manufacturer_retail_price ?? 0;

                $newPrice = $this->priceCalculator->applyPriceListAdjustment(
                    $currentPrice,
                    $adjustment['type'] ?? 'percentage',
                    $adjustment['value'] ?? 0
                );

                $product->update([
                    'manufacturer_retail_price' => $newPrice,
                ]);

                $updated++;
            }

            // Dispatch event AFTER persistence
            BulkProductPricesUpdated::dispatch([
                'filters' => $filters,
                'adjustment' => $adjustment,
                'products_updated' => $updated,
                'user_id' => auth()->id(),
            ]);

            return [
                'updated' => $updated,
                'products' => $products,
            ];
        });
    }

    /**
     * Get filtered products for bulk update
     *
     * @param  array  $filters  Filters to apply
     * @return Collection Filtered products
     */
    private function getFilteredProducts(array $filters): Collection
    {
        $query = Product::query()->active();

        if (isset($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (isset($filters['brand_code'])) {
            $query->whereHas('brand', fn ($q) => $q->where('code', $filters['brand_code'])
            );
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['product_type'])) {
            $query->where('product_type', $filters['product_type']);
        }

        return $query->get();
    }
}
