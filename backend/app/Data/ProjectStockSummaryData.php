<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class ProjectStockSummaryData extends Data
{
    public function __construct(
        public int $total_items_on_site,
        public float $total_value_on_site,
        public int $overdue_rental_items_count,
    ) {}
}
