<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;

class FinalBalanceData extends Data
{
    public function __construct(
        public int $project_id,
        public string $project_name,
        public string $project_code,
        public ?string $customer_name,
        public string $currency = 'EUR',

        // ── Quote Revenue ──────────────────────────────────────────────
        // Approved quote totals (what client was quoted)
        public float $quote_total = 0,
        public float $quote_labor_total = 0,
        public float $quote_material_total = 0,

        // ── Extras (beyond quote) ──────────────────────────────────────
        // Extra labor hours × customer_rate
        public float $extra_labor_revenue = 0,
        // Approved billable expenses
        public float $billable_expenses_revenue = 0,

        // ── Total Revenue ──────────────────────────────────────────────
        public float $total_revenue = 0,

        // ── Costs ──────────────────────────────────────────────────────
        // Internal: sum of approved ProjectLaborCost entries
        public float $labor_cost_total = 0,
        // External: sum of approved ProjectLaborCost entries (external workers)
        public float $external_labor_cost = 0,
        public float $internal_labor_cost = 0,
        // Material costs (ProjectMaterial × cost_price)
        public float $material_cost_total = 0,
        // Approved project expenses
        public float $approved_expenses_total = 0,

        // ── Total Cost ─────────────────────────────────────────────────
        public float $total_cost = 0,

        // ── Margin ─────────────────────────────────────────────────────
        public float $gross_margin = 0,
        public float $gross_margin_percent = 0,

        // ── Workers Summary ────────────────────────────────────────────
        /** @var DataCollection<ProjectWorkerData>|null */
        public ?DataCollection $workers = null,

        // ── Expenses Summary ───────────────────────────────────────────
        /** @var DataCollection<ProjectExpenseData>|null */
        public ?DataCollection $expenses = null,

        // ── Timestamps ─────────────────────────────────────────────────
        public ?string $generated_at = null,
    ) {}
}
