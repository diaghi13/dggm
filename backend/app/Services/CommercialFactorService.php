<?php

namespace App\Services;

use App\Enums\PriceListAdjustmentType;
use App\Models\PriceList;
use App\Models\Setting;

/**
 * CommercialFactorService
 *
 * Calculates the combined commercial factor from layered price lists.
 * CommercialFactor = global_index × layer_1_factor × layer_2_factor × ...
 *
 * Spec section 6.2: Price list layers applied in priority order.
 */
class CommercialFactorService
{
    /**
     * Calculate the combined commercial factor from multiple price list layers.
     * CommercialFactor = global_index × category_factor × client_factor × product_factor
     *
     * @param  array<int>  $priceListIds  Active price list IDs to apply (ordered by priority)
     */
    public function calculateFactor(array $priceListIds = []): float
    {
        $globalIndex = (float) Setting::get('rental.commercial_index', 1.00);

        if (empty($priceListIds)) {
            return $globalIndex;
        }

        $priceLists = PriceList::whereIn('id', $priceListIds)
            ->where('is_active', true)
            ->orderBy('priority')
            ->get();

        $combinedFactor = $globalIndex;

        foreach ($priceLists as $priceList) {
            $combinedFactor *= $this->getPriceListFactor($priceList);
        }

        return round($combinedFactor, 4);
    }

    /**
     * Convert a price list's adjustment to a multiplier factor.
     */
    private function getPriceListFactor(PriceList $priceList): float
    {
        $value = (float) $priceList->adjustment_value;

        return match ($priceList->adjustment_type) {
            PriceListAdjustmentType::Percentage => 1.0 + ($value / 100),
            PriceListAdjustmentType::Fixed => 1.0, // fixed amounts don't apply as multipliers
            default => 1.0,
        };
    }
}
