<?php

namespace App\Services;

use App\Data\FinalBalanceData;
use App\Data\ProjectExpenseData;
use App\Data\ProjectWorkerData;
use App\Enums\ProjectExpenseStatus;
use App\Enums\ProjectLogStatus;
use App\Enums\QuoteItemType;
use App\Models\Project;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelData\DataCollection;

class FinalBalanceService
{
    /**
     * Compute the Final Balance for a project.
     * Reads all necessary relationships — ensure eager-loading at the call site.
     */
    public function compute(Project $project): FinalBalanceData
    {
        $project->loadMissing([
            'quote.items',
            'projectWorkers.worker',
            'laborCosts',
            'expenses',
            'customer',
        ]);

        // ── 1. Quote Revenue ──────────────────────────────────────────────────
        $quoteTotal = 0.0;
        $quoteLaborTotal = 0.0;
        $quoteMaterialTotal = 0.0;

        if ($project->quote) {
            $quoteTotal = (float) $project->quote->total_amount;

            foreach ($project->quote->items as $item) {
                if ($item->type === QuoteItemType::Labor) {
                    $quoteLaborTotal += (float) $item->total;
                } elseif ($item->type === QuoteItemType::Material) {
                    $quoteMaterialTotal += (float) $item->total;
                }
            }
        }

        // ── 2. Extra Labor Revenue (hours beyond estimate × customer_rate) ────
        $extraLaborRevenue = 0.0;
        foreach ($project->projectWorkers as $slot) {
            if ($slot->customer_rate === null) {
                continue;
            }

            // Sum approved labor log hours
            $approvedLogs = $slot->laborLogs()
                ->where('status', ProjectLogStatus::Approved->value)
                ->get();

            $totalApprovedHours = $approvedLogs->sum(fn ($log) => (float) $log->regular_hours + (float) $log->overtime_hours
            );

            // Convert estimated_days to hours for comparison
            $hoursPerDay = (float) Setting::get('project.hours_per_day', 8);
            $estimatedHours = (float) ($slot->estimated_hours ?? 0)
                ?: ((float) ($slot->estimated_days ?? 0)) * $hoursPerDay;

            $extraHours = max(0, $totalApprovedHours - $estimatedHours);
            $extraLaborRevenue += $extraHours * (float) $slot->customer_rate;
        }

        // ── 3. Billable Expenses Revenue ─────────────────────────────────────
        $approvedStatuses = [
            ProjectExpenseStatus::Approved->value,
            ProjectExpenseStatus::AutoApproved->value,
        ];

        $billableExpensesRevenue = $project->expenses
            ->whereIn('status', $approvedStatuses)
            ->where('is_billable_to_client', true)
            ->sum(fn ($e) => (float) $e->amount);

        // ── 4. Total Revenue ─────────────────────────────────────────────────
        $totalRevenue = $quoteTotal + $extraLaborRevenue + $billableExpensesRevenue;

        // ── 5. Labor Costs ───────────────────────────────────────────────────
        $laborCostTotal = $project->laborCosts->sum(fn ($c) => (float) $c->total_cost);
        $externalLaborCost = $project->laborCosts
            ->whereIn('cost_type', ['contractor', 'subcontractor'])
            ->sum(fn ($c) => (float) $c->total_cost);
        $internalLaborCost = $laborCostTotal - $externalLaborCost;

        // ── 6. Material Costs ─────────────────────────────────────────────────
        $materialCostTotal = $project->materials()
            ->sum(DB::raw('used_quantity * COALESCE(actual_unit_cost, planned_unit_cost, 0)'));

        // ── 7. Approved Expenses Total ────────────────────────────────────────
        $approvedExpensesTotal = $project->expenses
            ->whereIn('status', $approvedStatuses)
            ->sum(fn ($e) => (float) $e->amount);

        // ── 8. Total Cost + Margin ────────────────────────────────────────────
        $totalCost = $laborCostTotal + $materialCostTotal + $approvedExpensesTotal;
        $grossMargin = $totalRevenue - $totalCost;
        $grossMarginPercent = $totalRevenue > 0
            ? ($grossMargin / $totalRevenue) * 100
            : 0.0;

        // ── 9. Workers Summary ────────────────────────────────────────────────
        $workers = ProjectWorkerData::collect(
            $project->projectWorkers,
            DataCollection::class
        );

        // ── 10. Expenses Summary ──────────────────────────────────────────────
        $expenses = ProjectExpenseData::collect(
            $project->expenses,
            DataCollection::class
        );

        return new FinalBalanceData(
            project_id: $project->id,
            project_name: $project->name,
            project_code: $project->code,
            customer_name: $project->customer?->name,
            quote_total: $quoteTotal,
            quote_labor_total: $quoteLaborTotal,
            quote_material_total: $quoteMaterialTotal,
            extra_labor_revenue: $extraLaborRevenue,
            billable_expenses_revenue: $billableExpensesRevenue,
            total_revenue: $totalRevenue,
            labor_cost_total: $laborCostTotal,
            external_labor_cost: $externalLaborCost,
            internal_labor_cost: $internalLaborCost,
            material_cost_total: (float) $materialCostTotal,
            approved_expenses_total: $approvedExpensesTotal,
            total_cost: $totalCost,
            gross_margin: $grossMargin,
            gross_margin_percent: round($grossMarginPercent, 2),
            workers: $workers,
            expenses: $expenses,
            generated_at: now()->toIso8601String(),
        );
    }
}
