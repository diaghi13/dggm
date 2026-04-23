<?php

namespace App\Services;

class AvailabilityCalculatorService
{
    /**
     * Determine availability status based on planned and free available quantity.
     *
     * available:    availableFree >= planned
     * partial:      0 < availableFree < planned
     * unavailable:  availableFree <= 0
     */
    public function determineStatus(float $planned, float $availableFree): string
    {
        if ($availableFree >= $planned) {
            return 'available';
        }

        if ($availableFree > 0) {
            return 'partial';
        }

        return 'unavailable';
    }

    /**
     * Calculate the shortage quantity (how much is missing).
     */
    public function calculateShortage(float $planned, float $availableFree): float
    {
        return max(0, $planned - $availableFree);
    }
}
