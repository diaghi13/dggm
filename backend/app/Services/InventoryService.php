<?php

namespace App\Services;

/**
 * InventoryService
 *
 * Contains ONLY business logic calculations for inventory.
 * NO database operations (use Query Classes for reads, Actions for writes).
 */
class InventoryService
{
    /**
     * Calculate reorder quantity based on min/max and current stock
     */
    public function calculateReorderQuantity(float $currentStock, float $minStock, float $maxStock): float
    {
        if ($currentStock >= $minStock) {
            return 0;
        }

        return max(0, $maxStock - $currentStock);
    }

    /**
     * Calculate days of stock remaining based on average daily usage
     */
    public function calculateDaysOfStock(float $currentStock, float $averageDailyUsage): float
    {
        if ($averageDailyUsage <= 0) {
            return PHP_FLOAT_MAX;
        }

        return $currentStock / $averageDailyUsage;
    }

    /**
     * Calculate stock turnover rate
     */
    public function calculateStockTurnover(float $totalSold, float $averageInventory): float
    {
        if ($averageInventory <= 0) {
            return 0;
        }

        return $totalSold / $averageInventory;
    }

    /**
     * Determine if stock is at critical level
     */
    public function isCriticalStock(float $currentStock, float $minStock): bool
    {
        return $currentStock <= ($minStock * 0.5);
    }

    /**
     * Calculate economic order quantity (EOQ)
     * Formula: sqrt((2 * demand * orderCost) / holdingCost)
     */
    public function calculateEconomicOrderQuantity(
        float $annualDemand,
        float $orderCost,
        float $holdingCostPerUnit
    ): float {
        if ($holdingCostPerUnit <= 0) {
            return 0;
        }

        return sqrt((2 * $annualDemand * $orderCost) / $holdingCostPerUnit);
    }

    /**
     * Calculate reorder point
     * Formula: (average daily demand * lead time days) + safety stock
     */
    public function calculateReorderPoint(
        float $averageDailyDemand,
        int $leadTimeDays,
        float $safetyStock = 0
    ): float {
        return ($averageDailyDemand * $leadTimeDays) + $safetyStock;
    }
}
