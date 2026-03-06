<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductSubrentalSupplier;
use App\Models\Setting;
use Illuminate\Support\Collection;

/**
 * SubrentalPricingService
 *
 * Calculates sub-rental pricing including:
 * - Supplier score based on price + reliability
 * - Client price from supplier cost + markup + commercial factor
 * - Margin check against threshold
 *
 * Phase 3 of the Rental Engine (spec section 8).
 */
class SubrentalPricingService
{
    /**
     * Calculate the supplier score for ranking.
     * Score = (normalized_price × price_weight) + (reliability_score × reliability_weight)
     * Higher score = better supplier.
     */
    public function calculateSupplierScore(
        ProductSubrentalSupplier $supplier,
        float $minRate,
        float $maxRate
    ): float {
        $priceWeight = (float) Setting::get('subrental.price_weight', 0.60);
        $reliabilityWeight = (float) Setting::get('subrental.reliability_weight', 0.40);

        // Normalize price: lower price = higher score
        $normalizedPrice = $maxRate > $minRate
            ? 1.0 - ($supplier->day_rate - $minRate) / ($maxRate - $minRate)
            : 1.0;

        // Normalize reliability: 0-5 scale → 0-1
        $normalizedReliability = (float) $supplier->reliability_score / 5.0;

        return round(
            ($normalizedPrice * $priceWeight) + ($normalizedReliability * $reliabilityWeight),
            4
        );
    }

    /**
     * Rank all subrental suppliers for a product.
     * Returns collection sorted by score descending.
     * If a supplier has is_preferred=true, it always comes first.
     */
    public function rankSuppliers(Product $product): Collection
    {
        $suppliers = $product->subrentalSuppliers()->with('supplier')->get();

        if ($suppliers->isEmpty()) {
            return collect();
        }

        $minRate = (float) $suppliers->min('day_rate');
        $maxRate = (float) $suppliers->max('day_rate');

        return $suppliers
            ->map(function (ProductSubrentalSupplier $s) use ($minRate, $maxRate) {
                $s->computed_score = $s->is_preferred
                    ? 999.0 // preferred always first
                    : $this->calculateSupplierScore($s, $minRate, $maxRate);

                return $s;
            })
            ->sortByDesc('computed_score')
            ->values();
    }

    /**
     * Calculate client price from supplier cost.
     * ClientPrice = SupplierCost × (1 + markup) × commercial_factor
     *
     * @return array{supplier_cost: float, client_price: float, margin_amount: float, margin_percent: float, markup_used: float}
     */
    public function calculateClientPrice(
        float $supplierDayRate,
        float $durationDays,
        int $quantity,
        float $durationMultiplier,
        ?float $productMarkupOverride = null,
        float $commercialFactor = 1.0
    ): array {
        $markup = $productMarkupOverride
            ?? (float) Setting::get('subrental.markup_default', 0.30);

        $supplierCost = $supplierDayRate * $durationMultiplier * $quantity;
        $clientPrice = $supplierCost * (1 + $markup) * $commercialFactor;
        $marginAmount = $clientPrice - $supplierCost;
        $marginPercent = $clientPrice > 0
            ? round(($marginAmount / $clientPrice) * 100, 2)
            : 0.0;

        return [
            'supplier_cost' => round($supplierCost, 2),
            'client_price' => round($clientPrice, 2),
            'margin_amount' => round($marginAmount, 2),
            'margin_percent' => $marginPercent,
            'markup_used' => $markup,
        ];
    }

    /**
     * Check if margin is below the configured threshold.
     */
    public function isBelowMarginThreshold(float $marginPercent): bool
    {
        $threshold = (float) Setting::get('subrental.min_margin_percent', 15);

        return $marginPercent < $threshold;
    }

    /**
     * Get the best supplier for a product (auto-selection).
     * Returns the top-ranked supplier or null if none available.
     */
    public function getBestSupplier(Product $product): ?ProductSubrentalSupplier
    {
        return $this->rankSuppliers($product)->first();
    }

    /**
     * Check if pricing mode blocks confirmation without supplier cost.
     */
    public function isBlockingMode(): bool
    {
        return Setting::get('subrental.pricing_mode', 'flexible_with_alert') === 'block';
    }
}
