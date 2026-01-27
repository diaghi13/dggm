<?php

namespace App\Services;

use App\Enums\DdtStatus;
use Carbon\Carbon;

/**
 * DdtService
 *
 * Contains ONLY business logic calculations/utilities for DDTs.
 * NO database operations (use Query Classes for reads, Actions for writes).
 */
class DdtService
{
    /**
     * Calculate estimated delivery date based on DDT type and distance
     */
    public function calculateEstimatedDelivery(
        Carbon $ddtDate,
        string $ddtType,
        ?float $distanceKm = null
    ): Carbon {
        // Local delivery: same day or next day
        if (! $distanceKm || $distanceKm < 50) {
            return $ddtDate->copy()->addDay();
        }

        // Regional delivery: 2-3 days
        if ($distanceKm < 200) {
            return $ddtDate->copy()->addDays(2);
        }

        // National delivery: 3-5 days
        return $ddtDate->copy()->addDays(4);
    }

    /**
     * Check if DDT is overdue for delivery
     */
    public function isOverdue(Carbon $ddtDate, ?Carbon $deliveredAt, int $expectedDays = 3): bool
    {
        if ($deliveredAt) {
            return false; // Already delivered
        }

        $expectedDeliveryDate = $ddtDate->copy()->addDays($expectedDays);

        return now()->isAfter($expectedDeliveryDate);
    }

    /**
     * Calculate DDT aging (days since creation)
     */
    public function calculateAging(Carbon $ddtDate, ?Carbon $deliveredAt = null): int
    {
        $endDate = $deliveredAt ?? now();

        return $ddtDate->diffInDays($endDate);
    }

    /**
     * Determine if DDT requires urgent attention
     */
    public function requiresUrgentAttention(
        DdtStatus $status,
        Carbon $ddtDate,
        ?Carbon $deliveredAt = null
    ): bool {
        // Already delivered or cancelled - no attention needed
        if (in_array($status, [DdtStatus::Delivered, DdtStatus::Cancelled])) {
            return false;
        }

        // In transit for more than 5 days
        if ($status === DdtStatus::InTransit && $this->calculateAging($ddtDate, $deliveredAt) > 5) {
            return true;
        }

        // Issued but not in transit after 2 days
        if ($status === DdtStatus::Issued && $this->calculateAging($ddtDate, $deliveredAt) > 2) {
            return true;
        }

        return false;
    }

    /**
     * Calculate total value of DDT items
     */
    public function calculateTotalValue(array $items): float
    {
        return array_reduce($items, function ($total, $item) {
            $quantity = $item['quantity'] ?? 0;
            $unitCost = $item['unit_cost'] ?? 0;

            return $total + ($quantity * $unitCost);
        }, 0);
    }

    /**
     * Calculate rental days between dates
     */
    public function calculateRentalDays(?Carbon $startDate, ?Carbon $endDate): int
    {
        if (! $startDate || ! $endDate) {
            return 0;
        }

        return max(1, $startDate->diffInDays($endDate) + 1); // Minimum 1 day
    }

    /**
     * Calculate rental cost
     */
    public function calculateRentalCost(
        float $dailyRate,
        Carbon $startDate,
        Carbon $endDate
    ): float {
        $days = $this->calculateRentalDays($startDate, $endDate);

        return $dailyRate * $days;
    }

    /**
     * Check if rental is overdue for return
     */
    public function isRentalOverdue(?Carbon $expectedReturnDate, ?Carbon $actualReturnDate = null): bool
    {
        if (! $expectedReturnDate || $actualReturnDate) {
            return false; // No expected date or already returned
        }

        return now()->isAfter($expectedReturnDate);
    }

    /**
     * Calculate late fee for overdue rental
     */
    public function calculateLateFee(
        float $dailyRate,
        Carbon $expectedReturnDate,
        ?Carbon $actualReturnDate = null,
        float $lateFeeMultiplier = 1.5
    ): float {
        if (! $this->isRentalOverdue($expectedReturnDate, $actualReturnDate)) {
            return 0;
        }

        $endDate = $actualReturnDate ?? now();
        $overdueDays = max(0, $expectedReturnDate->diffInDays($endDate));

        return $dailyRate * $lateFeeMultiplier * $overdueDays;
    }
}
