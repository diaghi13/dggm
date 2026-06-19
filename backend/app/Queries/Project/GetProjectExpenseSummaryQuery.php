<?php

namespace App\Queries\Project;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectExpense;

class GetProjectExpenseSummaryQuery
{
    public function __construct(private readonly Project $project) {}

    public function execute(): array
    {
        $expenses = ProjectExpense::query()
            ->where('project_id', $this->project->id)
            ->get();

        $byCategory = $expenses
            ->groupBy(fn ($expense) => $expense->category->value)
            ->map(function ($group, $categoryValue) {
                $totalActual = $group->sum(fn ($e) => (float) $e->amount);
                $totalBudgeted = $group->sum(fn ($e) => (float) ($e->budgeted_amount ?? 0));

                return [
                    'category' => $categoryValue,
                    'category_label' => $group->first()->category->name,
                    'count' => $group->count(),
                    'total_actual' => round($totalActual, 2),
                    'total_budgeted' => round($totalBudgeted, 2),
                    'variance' => round($totalActual - $totalBudgeted, 2),
                ];
            })
            ->values()
            ->toArray();

        $grandTotalActual = $expenses->sum(fn ($e) => (float) $e->amount);
        $grandTotalBudgeted = $expenses->sum(fn ($e) => (float) ($e->budgeted_amount ?? 0));

        return [
            'by_category' => $byCategory,
            'grand_total' => [
                'total_actual' => round($grandTotalActual, 2),
                'total_budgeted' => round($grandTotalBudgeted, 2),
                'variance' => round($grandTotalActual - $grandTotalBudgeted, 2),
            ],
        ];
    }
}
