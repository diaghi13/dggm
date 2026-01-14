<?php

namespace App\Services;

use App\Enums\RateContext;
use App\Enums\RateType;
use App\Models\Worker;
use App\Models\WorkerRate;
use Illuminate\Support\Facades\DB;

class RateCalculationService
{
    /**
     * Get current rate for worker in specific context
     */
    public function getCurrentRate(
        Worker $worker,
        RateContext $context,
        RateType $rateType,
        ?\DateTime $date = null
    ): ?WorkerRate {
        return $worker->getCurrentRate($context, $rateType, $date);
    }

    /**
     * Calculate labor cost for worker hours with multipliers
     */
    public function calculateLaborCost(
        Worker $worker,
        float $hours,
        bool $isOvertime = false,
        bool $isHoliday = false,
        ?int $siteId = null,
        ?\DateTime $date = null
    ): array {
        $date = $date ?? now();

        // Check for site-specific rate override
        $unitRate = null;
        if ($siteId) {
            $siteAssignment = $worker->siteAssignments()
                ->where('site_id', $siteId)
                ->where('is_active', true)
                ->first();

            if ($siteAssignment && $siteAssignment->hourly_rate_override) {
                $unitRate = $siteAssignment->hourly_rate_override;
            }
        }

        // If no site override, get standard internal cost rate
        if (! $unitRate) {
            $rate = $this->getCurrentRate(
                $worker,
                RateContext::InternalCost,
                RateType::Hourly,
                $date
            );

            if (! $rate) {
                throw new \Exception("No hourly rate found for worker {$worker->code}");
            }

            $unitRate = $rate->rate_amount;

            // Apply multipliers from rate
            if ($isHoliday) {
                $unitRate *= $rate->holiday_multiplier;
            } elseif ($isOvertime) {
                $unitRate *= $rate->overtime_multiplier;
            }
        } else {
            // Manual multipliers for overridden rates
            if ($isHoliday) {
                $unitRate *= 2.0;
            } elseif ($isOvertime) {
                $unitRate *= 1.5;
            }
        }

        $totalCost = $unitRate * $hours;

        return [
            'unit_rate' => $unitRate,
            'hours_worked' => $hours,
            'total_cost' => $totalCost,
            'is_overtime' => $isOvertime,
            'is_holiday' => $isHoliday,
        ];
    }

    /**
     * Create new rate and close previous one
     */
    public function createRateHistory(
        Worker $worker,
        array $rateData,
        \DateTime $effectiveFrom
    ): WorkerRate {
        return DB::transaction(function () use ($worker, $rateData, $effectiveFrom) {
            $context = $rateData['context'];
            $rateType = $rateData['rate_type'];

            // Close previous rate (set valid_to to day before new rate)
            $previousRate = $worker->getCurrentRate($context, $rateType, $effectiveFrom);
            if ($previousRate) {
                $dayBefore = (clone $effectiveFrom)->modify('-1 day');
                $previousRate->update(['valid_to' => $dayBefore]);
            }

            // Create new rate
            $rateData['valid_from'] = $effectiveFrom;
            $rateData['valid_to'] = null; // Open-ended

            return $worker->rates()->create($rateData);
        });
    }

    /**
     * Estimate monthly cost for employee (gross salary + contributions)
     */
    public function estimateMonthlyCost(Worker $worker): ?float
    {
        if (! $worker->payrollData) {
            return null;
        }

        // Use payrollData calculated value
        return $worker->payrollData->total_employment_cost;
    }

    /**
     * Calculate cost for project/fixed work
     */
    public function calculateFixedProjectCost(
        Worker $worker,
        ?string $projectType = null,
        ?\DateTime $date = null
    ): ?float {
        $rate = $this->getCurrentRate(
            $worker,
            RateContext::InternalCost,
            RateType::FixedProject,
            $date
        );

        if (! $rate) {
            return null;
        }

        // If project_type specified in rate, it must match
        if ($rate->project_type && $projectType && $rate->project_type !== $projectType) {
            return null;
        }

        return $rate->rate_amount;
    }

    /**
     * Get all current rates for worker across all contexts
     */
    public function getAllCurrentRates(Worker $worker, ?\DateTime $date = null): array
    {
        $date = $date ?? now();

        $rates = $worker->rates()
            ->where('valid_from', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('valid_to')
                    ->orWhere('valid_to', '>=', $date);
            })
            ->get()
            ->groupBy('context');

        $result = [];
        foreach (RateContext::cases() as $context) {
            $contextRates = $rates->get($context->value, collect());
            $result[$context->value] = $contextRates->groupBy('rate_type')->map(function ($items) {
                return $items->first(); // One rate per context+type combination
            })->values();
        }

        return $result;
    }

    /**
     * Calculate hourly rate from monthly salary
     */
    public function calculateHourlyRateFromSalary(float $monthlySalary, int $hoursPerMonth = 160): float
    {
        return $monthlySalary / $hoursPerMonth;
    }

    /**
     * Calculate daily rate from hourly rate
     */
    public function calculateDailyRate(float $hourlyRate, int $hoursPerDay = 8): float
    {
        return $hourlyRate * $hoursPerDay;
    }

    /**
     * Validate rate data before creation
     */
    public function validateRate(array $rateData): array
    {
        $errors = [];

        if (! isset($rateData['rate_type']) || ! isset($rateData['context'])) {
            $errors[] = 'Rate type and context are required';
        }

        if (! isset($rateData['rate_amount']) || $rateData['rate_amount'] <= 0) {
            $errors[] = 'Rate amount must be greater than 0';
        }

        if (! isset($rateData['valid_from'])) {
            $errors[] = 'Valid from date is required';
        }

        // Check multipliers
        $overtimeMultiplier = $rateData['overtime_multiplier'] ?? 1.5;
        $holidayMultiplier = $rateData['holiday_multiplier'] ?? 2.0;

        if ($overtimeMultiplier < 1.0 || $overtimeMultiplier > 3.0) {
            $errors[] = 'Overtime multiplier must be between 1.0 and 3.0';
        }

        if ($holidayMultiplier < 1.0 || $holidayMultiplier > 3.0) {
            $errors[] = 'Holiday multiplier must be between 1.0 and 3.0';
        }

        return $errors;
    }
}
