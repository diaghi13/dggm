<?php

namespace App\Services;

use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use Illuminate\Support\Collection;

/**
 * Product Pricing Service
 *
 * Orchestrates product pricing operations:
 * - Price list generation
 * - Bulk price updates
 * - Effective price calculation
 * - Rental price calculation
 *
 * All prices are NET (VAT excluded)
 */
class ProductPricingService
{
    public function __construct(
        private readonly PriceCalculatorService $priceCalculator
    ) {}

    /**
     * Calculate price for a product in automatic price list mode
     *
     * @return float Calculated sale price (net, VAT excluded)
     */
    public function calculateAutomaticPrice(Product $product, PriceList $priceList): float
    {
        // Get base sale price (purchase + markup)
        $baseSalePrice = $this->priceCalculator->calculateProductSalePrice($product);

        // Apply price list adjustment
        return $this->priceCalculator->applyPriceListAdjustment(
            $baseSalePrice,
            $priceList->adjustment_type,
            $priceList->adjustment_value
        );
    }

    /**
     * Generate price list item data for automatic mode
     *
     * @return array Price list item data
     */
    public function generateAutomaticPriceListItem(Product $product, PriceList $priceList): array
    {
        $salePrice = $this->calculateAutomaticPrice($product, $priceList);
        $rentalPrices = $this->priceCalculator->calculateRentalPrices($salePrice);

        return [
            'sale_price' => $salePrice,
            'is_manual_price' => false,
            'rental_daily' => $rentalPrices['daily'],
            'rental_weekly' => $rentalPrices['weekly'],
            'rental_monthly' => $rentalPrices['monthly'],
            'is_manual_rental' => false,
            'is_active' => true,
        ];
    }

    /**
     * Generate price list item data for manual mode
     * Uses product's base calculated price as starting point
     *
     * @return array Price list item data
     */
    public function generateManualPriceListItem(Product $product): array
    {
        $salePrice = $this->priceCalculator->calculateProductSalePrice($product);
        $rentalPrices = $this->priceCalculator->calculateRentalPrices($salePrice);

        return [
            'sale_price' => $salePrice,
            'is_manual_price' => true, // Manual mode - user can override
            'rental_daily' => $rentalPrices['daily'],
            'rental_weekly' => $rentalPrices['weekly'],
            'rental_monthly' => $rentalPrices['monthly'],
            'is_manual_rental' => false,
            'is_active' => true,
        ];
    }

    /**
     * Get effective price for product (from price list or fallback)
     *
     * @return array Price data with source
     */
    public function getEffectivePrice(Product $product, ?PriceList $priceList = null): array
    {
        // Try to get from price list
        if ($priceList) {
            $item = $priceList->items()
                ->where('product_id', $product->id)
                ->where('is_active', true)
                ->first();

            if ($item) {
                return [
                    'sale_price' => $item->sale_price,
                    'rental_daily' => $item->rental_daily,
                    'rental_weekly' => $item->rental_weekly,
                    'rental_monthly' => $item->rental_monthly,
                    'price_list_id' => $priceList->id,
                    'price_list_name' => $priceList->name,
                    'source' => 'price_list',
                ];
            }
        }

        // Fallback to manufacturer retail price (no markup)
        if ($product->manufacturer_retail_price) {
            $rentalPrices = $this->priceCalculator->calculateRentalPrices(
                $product->manufacturer_retail_price
            );

            return [
                'sale_price' => $product->manufacturer_retail_price,
                'rental_daily' => $rentalPrices['daily'],
                'rental_weekly' => $rentalPrices['weekly'],
                'rental_monthly' => $rentalPrices['monthly'],
                'price_list_id' => null,
                'price_list_name' => null,
                'source' => 'manufacturer_msrp',
            ];
        }

        // Last resort: calculate from purchase price
        $calculatedPrice = $this->priceCalculator->calculateProductSalePrice($product);
        $rentalPrices = $this->priceCalculator->calculateRentalPrices($calculatedPrice);

        return [
            'sale_price' => $calculatedPrice,
            'rental_daily' => $rentalPrices['daily'],
            'rental_weekly' => $rentalPrices['weekly'],
            'rental_monthly' => $rentalPrices['monthly'],
            'price_list_id' => null,
            'price_list_name' => null,
            'source' => 'calculated',
        ];
    }

    /**
     * Get default active price list
     */
    public function getDefaultPriceList(): ?PriceList
    {
        return PriceList::active()
            ->default()
            ->valid()
            ->first();
    }

    /**
     * Check if price list item should be regenerated
     * Manual prices are never regenerated automatically
     */
    public function shouldRegenerateItem(PriceListItem $item): bool
    {
        return ! $item->is_manual_price;
    }

    /**
     * Calculate price adjustment preview
     * Shows what prices would be with adjustment
     */
    public function previewPriceAdjustment(
        Collection $products,
        string $adjustmentType,
        ?float $adjustmentValue
    ): array {
        $preview = [];

        foreach ($products as $product) {
            $currentPrice = $this->priceCalculator->calculateProductSalePrice($product);
            $newPrice = $this->priceCalculator->applyPriceListAdjustment(
                $currentPrice,
                $adjustmentType,
                $adjustmentValue
            );

            $preview[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'current_price' => $currentPrice,
                'new_price' => $newPrice,
                'difference' => $newPrice - $currentPrice,
                'difference_percent' => $currentPrice > 0
                    ? round((($newPrice - $currentPrice) / $currentPrice) * 100, 2)
                    : 0,
            ];
        }

        return $preview;
    }
}
