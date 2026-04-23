<?php

namespace App\Services;

use Illuminate\Support\Collection;

class ExpenseCalculatorService
{
    public function calculateVariance(float $actual, float $budgeted): float
    {
        return round($actual - $budgeted, 2);
    }

    public function calculateBudgetedTotal(Collection $expenses): float
    {
        return round($expenses->sum(fn ($e) => (float) ($e->budgeted_amount ?? 0)), 2);
    }

    public function calculateBillableTotal(Collection $expenses): float
    {
        return round(
            $expenses
                ->filter(fn ($e) => (bool) $e->billable_to_final_balance)
                ->sum(fn ($e) => (float) $e->amount),
            2
        );
    }

    public function calculateActualTotal(Collection $expenses): float
    {
        return round($expenses->sum(fn ($e) => (float) $e->amount), 2);
    }
}
