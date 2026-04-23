<?php

namespace App\Services;

use Illuminate\Support\Collection;

/**
 * InspectionCalculatorService
 *
 * Pure calculation service for rental return inspection logic.
 * No database operations — only calculations on in-memory collections.
 */
class InspectionCalculatorService
{
    /**
     * Calculate the total estimated damage value across all inspection items.
     */
    public function calculateTotalDamageValue(Collection $items): float
    {
        return $items->sum(
            fn ($item) => ($item->quantity_damaged + $item->quantity_write_off) * ($item->repair_estimate ?? 0)
        );
    }

    /**
     * Suggest an action based on the condition of the item.
     */
    public function determineSuggestedAction(string $condition): string
    {
        return match ($condition) {
            'good' => 'return_to_stock',
            'minor_damage', 'major_damage' => 'quarantine',
            'write_off' => 'write_off',
            default => 'return_to_stock',
        };
    }

    /**
     * Calculate the total write-off value for items marked for write-off.
     */
    public function calculateTotalWriteOffValue(Collection $items): float
    {
        return $items
            ->filter(fn ($item) => $item->action?->value === 'write_off' || $item->action === 'write_off')
            ->sum(fn ($item) => $item->quantity_write_off * ($item->repair_estimate ?? 0));
    }
}
