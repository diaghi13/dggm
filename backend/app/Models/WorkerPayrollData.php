<?php

namespace App\Models;

use App\Enums\PayrollFrequency;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerPayrollData extends Model
{
    use HasFactory;

    protected $table = 'worker_payroll_data';

    protected $fillable = [
        'worker_id',
        'gross_monthly_salary',
        'net_monthly_salary',
        'contract_level',
        'ccnl_type',
        'payroll_frequency',
        'inps_percentage',
        'inail_percentage',
        'irpef_percentage',
        'meal_voucher_amount',
        'transport_allowance',
        'iban',
        'bank_name',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'payroll_frequency' => PayrollFrequency::class,
            'gross_monthly_salary' => 'decimal:2',
            'net_monthly_salary' => 'decimal:2',
            'inps_percentage' => 'decimal:2',
            'inail_percentage' => 'decimal:2',
            'irpef_percentage' => 'decimal:2',
            'meal_voucher_amount' => 'decimal:2',
            'transport_allowance' => 'decimal:2',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    // ==================== ACCESSORS ====================

    public function getTotalMonthlyBenefitsAttribute(): float
    {
        return $this->meal_voucher_amount + $this->transport_allowance;
    }

    public function getTotalMonthlyContributionsAttribute(): float
    {
        $inps = $this->gross_monthly_salary * ($this->inps_percentage / 100);
        $inail = $this->gross_monthly_salary * ($this->inail_percentage / 100);
        $irpef = $this->gross_monthly_salary * ($this->irpef_percentage / 100);

        return $inps + $inail + $irpef;
    }

    public function getEstimatedNetSalaryAttribute(): float
    {
        if ($this->net_monthly_salary) {
            return $this->net_monthly_salary;
        }

        // Rough estimate if net not set
        return $this->gross_monthly_salary - $this->total_monthly_contributions;
    }

    public function getAnnualGrossSalaryAttribute(): float
    {
        // Italian standard: 13 or 14 mensilità
        return $this->gross_monthly_salary * 13;
    }

    public function getTotalEmploymentCostAttribute(): float
    {
        // Gross salary + employer contributions (typically ~30% in Italy)
        $employerContributions = $this->gross_monthly_salary * 0.30;

        return $this->gross_monthly_salary + $employerContributions + $this->total_monthly_benefits;
    }

    // ==================== METHODS ====================

    /**
     * Calculate monthly cost for a given number of months
     */
    public function calculateCost(int $months = 1): float
    {
        return $this->total_employment_cost * $months;
    }

    /**
     * Calculate hourly cost based on standard working hours
     */
    public function getHourlyCost(int $monthlyHours = 160): float
    {
        return $this->total_employment_cost / $monthlyHours;
    }
}
