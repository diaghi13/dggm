<?php

namespace App\Services;

use Illuminate\Support\Collection;

class ProjectServiceCalculatorService
{
    public function calculateTotal(float $qty, float $unitPrice): float
    {
        return $qty * $unitPrice;
    }

    public function calculateMargin(float $total, float $costPrice, float $qty): float
    {
        return $total - ($qty * $costPrice);
    }

    public function calculateMarginPercentage(float $margin, float $total): float
    {
        if ($total == 0) {
            return 0.0;
        }

        return round(($margin / $total) * 100, 2);
    }

    public function calculateTotalRevenue(Collection $services): float
    {
        return $services->sum(fn ($service) => (float) $service->quantity * (float) $service->unit_price);
    }

    public function calculateTotalCost(Collection $services): float
    {
        return $services->sum(function ($service) {
            if ($service->cost_price === null) {
                return 0.0;
            }

            return (float) $service->quantity * (float) $service->cost_price;
        });
    }

    public function calculateTotalMargin(Collection $services): float
    {
        return $this->calculateTotalRevenue($services) - $this->calculateTotalCost($services);
    }
}
