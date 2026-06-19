<?php

namespace App\Domains\Product\Services;

use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Enums\QuoteType;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Services\PriceCalculatorService;
use App\Services\RentalEngineService;
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
        private readonly PriceCalculatorService $priceCalculator,
        private readonly RentalEngineService $rentalEngine
    ) {}

    /**
     * Calculate price for a product in automatic price list mode
     *
     * For composite products the sale price is derived from component prices via
     * calculateCompositePrices(), not from supplier purchase price + markup (which
     * would always return 0 because composites have no supplier).
     *
     * @return float Calculated sale price (net, VAT excluded)
     */
    public function calculateAutomaticPrice(Product $product, PriceList $priceList): float
    {
        if ($product->product_type === ProductType::COMPOSITE) {
            // Composite: aggregate from components
            $compositePrices = $this->calculateCompositePrices($product);
            $baseSalePrice = $compositePrices['sale_price'];
        } else {
            // Article / Service: purchase price + markup
            $baseSalePrice = $this->priceCalculator->calculateProductSalePrice($product);
        }

        // Apply price list adjustment
        return $this->priceCalculator->applyPriceListAdjustment(
            $baseSalePrice,
            $priceList->adjustment_type->value,
            $priceList->adjustment_value
        );
    }

    /**
     * Generate price list item data for automatic mode
     *
     * For composite products all rental tiers are also derived from component
     * aggregation, not from the simple sale-price-based rental formula.
     *
     * @return array Price list item data
     */
    public function generateAutomaticPriceListItem(Product $product, PriceList $priceList): array
    {
        $productFields = [
            'name' => $product->name,
            'code' => $product->code,
            'unit' => $product->unit,
        ];

        if ($product->product_type === ProductType::COMPOSITE) {
            $compositePrices = $this->calculateCompositePrices($product);
            $salePrice = $this->priceCalculator->applyPriceListAdjustment(
                $compositePrices['sale_price'],
                $priceList->adjustment_type->value,
                $priceList->adjustment_value
            );

            return [
                ...$productFields,
                'sale_price' => $salePrice,
                'is_manual_price' => false,
                'rental_hourly' => $compositePrices['rental_hourly'],
                'rental_half_day' => $compositePrices['rental_half_day'],
                'rental_daily' => $compositePrices['rental_daily'],
                'rental_weekly' => $compositePrices['rental_weekly'],
                'rental_monthly' => $compositePrices['rental_monthly'],
                'rental_seasonal' => $compositePrices['rental_seasonal'],
                'is_manual_rental' => false,
                'is_active' => true,
            ];
        }

        if ($product->product_type === ProductType::SERVICE) {
            $salePrice = $this->calculateAutomaticPrice($product, $priceList);

            return [
                ...$productFields,
                'sale_price' => $salePrice,
                'is_manual_price' => false,
                'rental_hourly' => null,
                'rental_half_day' => null,
                'rental_daily' => null,
                'rental_weekly' => null,
                'rental_monthly' => null,
                'rental_seasonal' => null,
                'is_manual_rental' => false,
                'is_active' => true,
            ];
        }

        $salePrice = $this->calculateAutomaticPrice($product, $priceList);
        $purchasePrice = $this->priceCalculator->calculateProductPurchasePrice($product);
        $rentalPrices = $this->priceCalculator->calculateRentalPrices($purchasePrice);

        return [
            ...$productFields,
            'sale_price' => $salePrice,
            'is_manual_price' => false,
            'rental_daily' => $rentalPrices['daily'],
            'rental_hourly' => $rentalPrices['hourly'],
            'rental_half_day' => $rentalPrices['half_day'],
            'rental_weekly' => $rentalPrices['weekly'],
            'rental_monthly' => $rentalPrices['monthly'],
            'rental_seasonal' => $rentalPrices['seasonal'],
            'is_manual_rental' => false,
            'is_active' => true,
        ];
    }

    /**
     * Generate price list item data for manual mode
     * Uses product's base calculated price as starting point.
     *
     * For composite products the starting price is aggregated from components.
     *
     * @return array Price list item data
     */
    public function generateManualPriceListItem(Product $product): array
    {
        $productFields = [
            'name' => $product->name,
            'code' => $product->code,
            'unit' => $product->unit,
        ];

        if ($product->product_type === ProductType::COMPOSITE) {
            $compositePrices = $this->calculateCompositePrices($product);
            $salePrice = $compositePrices['sale_price'];

            return [
                ...$productFields,
                'sale_price' => $salePrice,
                'is_manual_price' => true,
                'rental_hourly' => $compositePrices['rental_hourly'],
                'rental_half_day' => $compositePrices['rental_half_day'],
                'rental_daily' => $compositePrices['rental_daily'],
                'rental_weekly' => $compositePrices['rental_weekly'],
                'rental_monthly' => $compositePrices['rental_monthly'],
                'rental_seasonal' => $compositePrices['rental_seasonal'],
                'is_manual_rental' => false,
                'is_active' => true,
            ];
        }

        if ($product->product_type === ProductType::SERVICE) {
            $salePrice = $this->priceCalculator->calculateProductSalePrice($product);

            return [
                ...$productFields,
                'sale_price' => $salePrice,
                'is_manual_price' => true,
                'rental_hourly' => null,
                'rental_half_day' => null,
                'rental_daily' => null,
                'rental_weekly' => null,
                'rental_monthly' => null,
                'rental_seasonal' => null,
                'is_manual_rental' => false,
                'is_active' => true,
            ];
        }

        $salePrice = $this->priceCalculator->calculateProductSalePrice($product);
        $purchasePrice = $this->priceCalculator->calculateProductPurchasePrice($product);
        $rentalPrices = $this->priceCalculator->calculateRentalPrices($purchasePrice);

        return [
            ...$productFields,
            'sale_price' => $salePrice,
            'is_manual_price' => true,
            'rental_daily' => $rentalPrices['daily'],
            'rental_hourly' => $rentalPrices['hourly'],
            'rental_half_day' => $rentalPrices['half_day'],
            'rental_weekly' => $rentalPrices['weekly'],
            'rental_monthly' => $rentalPrices['monthly'],
            'rental_seasonal' => $rentalPrices['seasonal'],
            'is_manual_rental' => false,
            'is_active' => true,
        ];
    }

    /**
     * Get effective price for product (from price list or fallback).
     *
     * When no price list is available and the quote is of type rental or event,
     * rental prices are calculated via RentalEngineService instead of falling back
     * to sale_price-based formulas.
     *
     * @param  string|null  $quoteType  QuoteType enum value ('sale', 'rental', 'event') or null
     * @return array Price data with source
     */
    public function getEffectivePrice(Product $product, ?PriceList $priceList = null, ?string $quoteType = null, ?int $durationDays = null): array
    {
        // Try to get from price list
        if ($priceList) {
            $item = $priceList->items()
                ->where('product_id', $product->id)
                ->where('is_active', true)
                ->first();

            if ($item) {
                $result = [
                    'sale_price' => $item->sale_price,
                    'rental_hourly' => $item->rental_hourly,
                    'rental_half_day' => $item->rental_half_day,
                    'rental_daily' => $item->rental_daily,
                    'rental_weekly' => $item->rental_weekly,
                    'rental_monthly' => $item->rental_monthly,
                    'rental_seasonal' => $item->rental_seasonal,
                    'price_list_id' => $priceList->id,
                    'price_list_item_id' => $item->id,
                    'price_list_name' => $priceList->name,
                    'source' => 'price_list',
                ];

                return $this->appendDurationTotal($result, $quoteType, $durationDays);
            }
        }

        // For composite products: always aggregate from components (no supplier-based pricing)
        if ($product->product_type === ProductType::COMPOSITE) {
            $compositePrices = $this->calculateCompositePrices($product);

            $result = [
                'sale_price' => $compositePrices['sale_price'],
                'rental_hourly' => $compositePrices['rental_hourly'],
                'rental_half_day' => $compositePrices['rental_half_day'],
                'rental_daily' => $compositePrices['rental_daily'],
                'rental_weekly' => $compositePrices['rental_weekly'],
                'rental_monthly' => $compositePrices['rental_monthly'],
                'rental_seasonal' => $compositePrices['rental_seasonal'],
                'price_list_id' => null,
                'price_list_item_id' => null,
                'price_list_name' => null,
                'source' => 'calculated',
            ];

            return $this->appendDurationTotal($result, $quoteType, $durationDays);
        }

        // For rental/event quotes without a price list: use RentalEngineService directly
        // so that rental prices are calculated from the product cost, not from sale_price.
        $isRentalContext = in_array($quoteType, [QuoteType::Rental->value, QuoteType::Event->value], strict: true);

        if ($isRentalContext) {
            $purchasePrice = $this->priceCalculator->calculateProductPurchasePrice($product);
            $rentalPrices = $this->rentalEngine->calculateRentalPrices(
                $purchasePrice,
                null,
                $product->estimated_base_day > 0 ? (float) $product->estimated_base_day : null,
                (bool) $product->is_premium
            );

            $result = [
                'sale_price' => $this->priceCalculator->calculateProductSalePrice($product),
                'rental_hourly' => $rentalPrices['hourly'],
                'rental_half_day' => $rentalPrices['half_day'],
                'rental_daily' => $rentalPrices['daily'],
                'rental_weekly' => $rentalPrices['weekly'],
                'rental_monthly' => $rentalPrices['monthly'],
                'rental_seasonal' => $rentalPrices['seasonal'],
                'price_list_id' => null,
                'price_list_item_id' => null,
                'price_list_name' => null,
                'source' => 'calculated_rental',
            ];

            return $this->appendDurationTotal($result, $quoteType, $durationDays);
        }

        // Fallback to manufacturer retail price (no markup for sale, but rental uses purchase cost)
        if ($product->manufacturer_retail_price) {
            $purchasePrice = $this->priceCalculator->calculateProductPurchasePrice($product);
            $rentalPrices = $this->priceCalculator->calculateRentalPrices($purchasePrice);

            $result = [
                'sale_price' => $product->manufacturer_retail_price,
                'rental_hourly' => $rentalPrices['hourly'],
                'rental_half_day' => $rentalPrices['half_day'],
                'rental_daily' => $rentalPrices['daily'],
                'rental_weekly' => $rentalPrices['weekly'],
                'rental_monthly' => $rentalPrices['monthly'],
                'rental_seasonal' => $rentalPrices['seasonal'],
                'price_list_id' => null,
                'price_list_name' => null,
                'source' => 'manufacturer_msrp',
            ];

            return $this->appendDurationTotal($result, $quoteType, $durationDays);
        }

        // Last resort: calculate from purchase price
        $calculatedPrice = $this->priceCalculator->calculateProductSalePrice($product);
        $purchasePrice = $this->priceCalculator->calculateProductPurchasePrice($product);
        $rentalPrices = $this->priceCalculator->calculateRentalPrices($purchasePrice);

        $result = [
            'sale_price' => $calculatedPrice,
            'rental_hourly' => $rentalPrices['hourly'],
            'rental_half_day' => $rentalPrices['half_day'],
            'rental_daily' => $rentalPrices['daily'],
            'rental_weekly' => $rentalPrices['weekly'],
            'rental_monthly' => $rentalPrices['monthly'],
            'rental_seasonal' => $rentalPrices['seasonal'],
            'price_list_id' => null,
            'price_list_name' => null,
            'source' => 'calculated',
        ];

        return $this->appendDurationTotal($result, $quoteType, $durationDays);
    }

    /**
     * Append rental_total, duration_days and duration_multiplier to a pricing result
     * when duration_days is provided and quote is of rental/event type.
     */
    private function appendDurationTotal(array $result, ?string $quoteType, ?int $durationDays): array
    {
        if ($durationDays && in_array($quoteType, [QuoteType::Rental->value, QuoteType::Event->value], strict: true)) {
            $multiplier = $this->rentalEngine->calculateDurationMultiplier(
                (float) $durationDays,
                null
            );
            $result['rental_total'] = round(($result['rental_daily'] ?? 0) * $durationDays * $multiplier, 2);
            $result['duration_days'] = $durationDays;
            $result['duration_multiplier'] = $multiplier;
        }

        return $result;
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
     * Calculate all prices for a composite product from its components.
     *
     * Iterates component relations (relation_type.code = 'component') and sums:
     * - standard_cost × quantity → composite_standard_cost
     * - sale_price from default price list (or calculateProductSalePrice fallback) × quantity → composite_sale_price
     * - rental_* × quantity for each rental tier → composite_rental_*
     * - estimated_base_day (for rentable composites) → sum of component estimated_base_day × quantity
     *
     * Components that lack rental prices have their rental prices estimated via
     * RentalEngineService::calculateRentalPrices() using the component sale price.
     *
     * @return array{
     *   standard_cost: float,
     *   sale_price: float,
     *   rental_hourly: float,
     *   rental_half_day: float,
     *   rental_daily: float,
     *   rental_weekly: float,
     *   rental_monthly: float,
     *   rental_seasonal: float,
     *   estimated_base_day: float,
     *   components_count: int,
     * }
     */
    public function calculateCompositePrices(Product $composite): array
    {
        if ($composite->product_type !== ProductType::COMPOSITE) {
            return $this->emptyCompositePrices();
        }

        $componentRelations = $composite->components()
            ->with(['relatedProduct.priceListItems' => function ($q) {
                $q->where('is_active', true)
                    ->whereHas('priceList', fn ($pq) => $pq->where('is_active', true)->where('is_default', true));
            }])
            ->get();

        if ($componentRelations->isEmpty()) {
            return $this->emptyCompositePrices();
        }

        $totals = [
            'standard_cost' => 0.0,
            'sale_price' => 0.0,
            'rental_hourly' => 0.0,
            'rental_half_day' => 0.0,
            'rental_daily' => 0.0,
            'rental_weekly' => 0.0,
            'rental_monthly' => 0.0,
            'rental_seasonal' => 0.0,
            'estimated_base_day' => 0.0,
            'components_count' => $componentRelations->count(),
        ];

        foreach ($componentRelations as $relation) {
            $component = $relation->relatedProduct;

            if (! $component) {
                continue;
            }

            // Quantity this component contributes per 1 unit of parent
            $qty = $relation->calculateQuantity(1);

            if ($qty <= 0) {
                continue;
            }

            // --- standard_cost ---
            $componentCost = (float) ($component->standard_cost ?? $component->manufacturer_cost_price ?? 0);
            $totals['standard_cost'] += $componentCost * $qty;

            // --- sale_price: prefer default active price list item, else calculate ---
            $priceListItem = $component->priceListItems->first();
            $componentSalePrice = $priceListItem
                ? (float) $priceListItem->sale_price
                : $this->priceCalculator->calculateProductSalePrice($component);
            $totals['sale_price'] += $componentSalePrice * $qty;

            // --- rental prices: prefer price list item, else estimate ---
            if ($priceListItem && $priceListItem->rental_daily !== null) {
                $totals['rental_hourly'] += (float) ($priceListItem->rental_hourly ?? 0) * $qty;
                $totals['rental_half_day'] += (float) ($priceListItem->rental_half_day ?? 0) * $qty;
                $totals['rental_daily'] += (float) $priceListItem->rental_daily * $qty;
                $totals['rental_weekly'] += (float) ($priceListItem->rental_weekly ?? 0) * $qty;
                $totals['rental_monthly'] += (float) ($priceListItem->rental_monthly ?? 0) * $qty;
                $totals['rental_seasonal'] += (float) ($priceListItem->rental_seasonal ?? 0) * $qty;
            } else {
                // Estimate rental prices from component purchase cost (not sale price)
                $rentalPrices = $this->rentalEngine->calculateRentalPrices($componentCost, null, null, (bool) $component->is_premium);
                $totals['rental_hourly'] += $rentalPrices['hourly'] * $qty;
                $totals['rental_half_day'] += $rentalPrices['half_day'] * $qty;
                $totals['rental_daily'] += $rentalPrices['daily'] * $qty;
                $totals['rental_weekly'] += $rentalPrices['weekly'] * $qty;
                $totals['rental_monthly'] += $rentalPrices['monthly'] * $qty;
                $totals['rental_seasonal'] += $rentalPrices['seasonal'] * $qty;
            }

            // --- estimated_base_day ---
            $componentBaseDay = (float) ($component->estimated_base_day ?? 0);
            if ($componentBaseDay <= 0) {
                $componentBaseDay = $this->rentalEngine->calculateEstimatedBaseDay(
                    $componentCost,
                    (bool) $component->is_premium
                );
            }
            $totals['estimated_base_day'] += $componentBaseDay * $qty;
        }

        // Round all monetary values
        foreach (['standard_cost', 'sale_price', 'rental_hourly', 'rental_half_day', 'rental_daily', 'rental_weekly', 'rental_monthly', 'rental_seasonal', 'estimated_base_day'] as $key) {
            $totals[$key] = round($totals[$key], 2);
        }

        return $totals;
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
     * Return zero-value composite prices array
     */
    private function emptyCompositePrices(): array
    {
        return [
            'standard_cost' => 0.0,
            'sale_price' => 0.0,
            'rental_hourly' => 0.0,
            'rental_half_day' => 0.0,
            'rental_daily' => 0.0,
            'rental_weekly' => 0.0,
            'rental_monthly' => 0.0,
            'rental_seasonal' => 0.0,
            'estimated_base_day' => 0.0,
            'components_count' => 0,
        ];
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
