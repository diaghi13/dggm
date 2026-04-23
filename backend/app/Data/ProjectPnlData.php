<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;

class ProjectPnlData extends Data
{
    public function __construct(
        public readonly int $project_id,
        public readonly string $project_name,
        public readonly string $project_code,
        public readonly ?string $customer_name,

        // Revenue
        public readonly float $quote_total,
        public readonly float $quote_labor_total,
        public readonly float $quote_material_total,
        public readonly float $extra_labor_revenue,
        public readonly float $billable_expenses_revenue,
        public readonly float $total_revenue,

        // Costs
        public readonly float $labor_cost_total,
        public readonly float $external_labor_cost,
        public readonly float $internal_labor_cost,
        public readonly float $material_cost_total,
        public readonly float $approved_expenses_total,
        public readonly float $total_cost,

        // Margin
        public readonly float $gross_margin,
        public readonly float $gross_margin_percent,

        // Details
        public readonly DataCollection|Lazy $workers,
        public readonly DataCollection|Lazy $expenses,
        public readonly ?string $generated_at,
    ) {}
}
