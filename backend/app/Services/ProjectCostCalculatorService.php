<?php

namespace App\Services;

use Illuminate\Support\Collection;

/**
 * ProjectCostCalculatorService
 *
 * Pure calculation service for project cost analysis.
 * Contains NO database queries — only calculations and formatting.
 */
class ProjectCostCalculatorService
{
    /**
     * Calculate the absolute margin (estimated revenue minus actual cost).
     */
    public function calculateMargin(float $estimatedAmount, float $actualCost): float
    {
        return $estimatedAmount - $actualCost;
    }

    /**
     * Calculate the margin as a percentage of estimated amount.
     * Returns 0 if estimated amount is zero to avoid division by zero.
     */
    public function calculateMarginPercentage(float $estimatedAmount, float $actualCost): float
    {
        if ($estimatedAmount == 0) {
            return 0.0;
        }

        $margin = $this->calculateMargin($estimatedAmount, $actualCost);

        return ($margin / $estimatedAmount) * 100;
    }

    /**
     * Calculate the cost variance for a material (planned vs actual).
     * A positive result means under budget; negative means over budget.
     */
    public function calculateMaterialCostVariance(float $plannedQty, float $plannedCost, float $usedQty, float $actualCost): float
    {
        $plannedTotal = $plannedQty * $plannedCost;
        $actualTotal = $usedQty * $actualCost;

        return $plannedTotal - $actualTotal;
    }

    /**
     * Calculate a breakdown of labor costs split by type.
     *
     * @param  Collection  $laborCosts  Collection of ProjectLaborCost models
     * @return array{total: float, internal: float, contractor: float, breakdown_by_type: array<string, float>}
     */
    public function calculateLaborBreakdown(Collection $laborCosts): array
    {
        $total = 0.0;
        $internal = 0.0;
        $contractor = 0.0;
        $breakdownByType = [];

        foreach ($laborCosts as $cost) {
            $amount = (float) $cost->total_cost;
            $type = $cost->cost_type instanceof \BackedEnum
                ? $cost->cost_type->value
                : (string) $cost->cost_type;

            $total += $amount;
            $breakdownByType[$type] = ($breakdownByType[$type] ?? 0.0) + $amount;

            if ($cost->is_internal ?? false) {
                $internal += $amount;
            } else {
                $contractor += $amount;
            }
        }

        return [
            'total' => round($total, 2),
            'internal' => round($internal, 2),
            'contractor' => round($contractor, 2),
            'breakdown_by_type' => array_map(fn ($v) => round($v, 2), $breakdownByType),
        ];
    }

    /**
     * Calculate the project progress as a percentage of actual cost versus estimated amount.
     * Returns 0 if estimated is zero; caps at 100 (or beyond to signal over-budget).
     */
    public function calculateProjectProgress(float $estimated, float $actual): float
    {
        if ($estimated == 0) {
            return 0.0;
        }

        return round(($actual / $estimated) * 100, 2);
    }
}
