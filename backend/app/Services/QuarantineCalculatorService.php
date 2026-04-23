<?php

namespace App\Services;

use Carbon\Carbon;

class QuarantineCalculatorService
{
    /**
     * Calculate how many days an item has been in quarantine.
     */
    public function calculateDurationDays(Carbon $since): int
    {
        return (int) $since->diffInDays(now());
    }

    /**
     * Determine if an expected repair return date has passed.
     */
    public function isOverdue(Carbon $expectedReturn): bool
    {
        return $expectedReturn->isPast();
    }

    /**
     * Estimate repair cost based on damage level and product value.
     */
    public function estimateRepairCost(string $damageLevel, float $productValue): float
    {
        return match ($damageLevel) {
            'write_off' => $productValue,
            'major' => $productValue * 0.6,
            'minor' => $productValue * 0.2,
            default => $productValue * 0.3,
        };
    }

    /**
     * Categorize quarantine duration to help prioritize attention.
     */
    public function getDurationCategory(int $days): string
    {
        if ($days <= 7) {
            return 'fresh';
        }

        if ($days <= 30) {
            return 'normal';
        }

        if ($days <= 90) {
            return 'aging';
        }

        return 'critical';
    }
}
