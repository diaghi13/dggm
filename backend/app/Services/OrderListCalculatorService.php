<?php

namespace App\Services;

class OrderListCalculatorService
{
    /**
     * Calculate the quantity that still needs to be ordered.
     * Accounts for free stock and already-reserved/allocated quantity.
     */
    public function calculateToOrder(float $planned, float $availableFree, float $alreadyReserved): float
    {
        return max(0, $planned - $availableFree - $alreadyReserved);
    }

    /**
     * Classify a material item into one of three categories:
     *   - 'available':    nothing to order (toOrder <= 0)
     *   - 'to_subrental': shortage and item is a rental OR subrental suppliers exist
     *   - 'to_purchase':  shortage, not a rental, no subrental suppliers
     *
     * Rental materials (is_rental = true) are time-based billing items and should always
     * go to subrental on shortage — they are never purchased outright.
     */
    public function classifyItem(bool $hasSubrentalSuppliers, float $toOrder, bool $isRental = false): string
    {
        if ($toOrder <= 0) {
            return 'available';
        }

        if ($isRental || $hasSubrentalSuppliers) {
            return 'to_subrental';
        }

        return 'to_purchase';
    }

    /**
     * Estimate purchase cost for an order quantity.
     */
    public function estimatePurchaseCost(float $qty, float $standardCost): float
    {
        return $qty * $standardCost;
    }
}
