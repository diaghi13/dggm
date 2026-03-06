<?php

namespace App\Services;

use App\Enums\LaborCostType;
use App\Models\Contractor;
use App\Models\Project;
use App\Models\ProjectLaborCost;
use App\Models\Worker;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CostAllocationService
{
    public function __construct(
        private readonly RateCalculationService $rateService
    ) {}

    /**
     * Allocate worker hours to project (creates ProjectLaborCost record)
     */
    public function allocateWorkerHours(
        Project $project,
        Worker $worker,
        float $hours,
        \DateTime $workDate,
        array $options = []
    ): ProjectLaborCost {
        $isOvertime = $options['is_overtime'] ?? false;
        $isHoliday = $options['is_holiday'] ?? false;
        $description = $options['description'] ?? null;
        $costCategory = $options['cost_category'] ?? null;

        // Calculate cost using RateCalculationService
        $costData = $this->rateService->calculateLaborCost(
            $worker,
            $hours,
            $isOvertime,
            $isHoliday,
            $project->id,
            $workDate
        );

        // Create labor cost record
        $laborCost = $project->laborCosts()->create([
            'cost_type' => LaborCostType::InternalLabor,
            'worker_id' => $worker->id,
            'description' => $description,
            'work_date' => $workDate,
            'hours_worked' => $costData['hours_worked'],
            'unit_rate' => $costData['unit_rate'],
            'total_cost' => $costData['total_cost'],
            'is_overtime' => $costData['is_overtime'],
            'is_holiday' => $costData['is_holiday'],
            'cost_category' => $costCategory,
        ]);

        // Update project actual cost
        $this->updateProjectActualCost($project);

        return $laborCost;
    }

    /**
     * Allocate contractor cost (from invoice)
     */
    public function allocateContractorCost(
        Project $project,
        Contractor $contractor,
        array $data
    ): ProjectLaborCost {
        return DB::transaction(function () use ($project, $contractor, $data) {
            // Create labor cost record
            $laborCost = $project->laborCosts()->create([
                'cost_type' => $data['cost_type'] ?? LaborCostType::Contractor,
                'contractor_id' => $contractor->id,
                'worker_id' => $data['worker_id'] ?? null, // Optional specific worker
                'description' => $data['description'],
                'work_date' => $data['work_date'],
                'hours_worked' => $data['hours_worked'] ?? null,
                'quantity' => $data['quantity'] ?? 1,
                'unit_rate' => $data['unit_rate'],
                'total_cost' => $data['total_cost'],
                'invoice_number' => $data['invoice_number'] ?? null,
                'invoice_date' => $data['invoice_date'] ?? null,
                'is_invoiced' => isset($data['invoice_number']),
                'cost_category' => $data['cost_category'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // Update project actual cost
            $this->updateProjectActualCost($project);

            return $laborCost;
        });
    }

    /**
     * Update project actual_cost from all labor costs
     */
    public function updateProjectActualCost(Project $project): void
    {
        $project->updateActualCost();
    }

    /**
     * Get labor cost breakdown for project
     */
    public function getLaborCostBreakdown(Project $project): array
    {
        $totalLabor = $project->total_labor_cost;
        $internalLabor = $project->internal_labor_cost;
        $contractorCost = $project->contractor_cost;

        $byWorker = $project->laborCosts()
            ->internalLabor()
            ->with('worker')
            ->get()
            ->groupBy('worker_id')
            ->map(function ($costs, $workerId) {
                $worker = $costs->first()->worker;

                return [
                    'worker_id' => $workerId,
                    'worker_code' => $worker->code,
                    'worker_name' => $worker->full_name,
                    'total_hours' => $costs->sum('hours_worked'),
                    'total_cost' => $costs->sum('total_cost'),
                    'average_rate' => $costs->avg('unit_rate'),
                ];
            })
            ->values();

        $byContractor = $project->laborCosts()
            ->contractorLabor()
            ->with('contractor')
            ->get()
            ->groupBy('contractor_id')
            ->map(function ($costs, $contractorId) {
                $contractor = $costs->first()->contractor;

                return [
                    'contractor_id' => $contractorId,
                    'contractor_code' => $contractor->code,
                    'contractor_name' => $contractor->company_name,
                    'total_invoiced' => $costs->where('is_invoiced', true)->sum('total_cost'),
                    'total_pending' => $costs->where('is_invoiced', false)->sum('total_cost'),
                    'total_cost' => $costs->sum('total_cost'),
                ];
            })
            ->values();

        $byCategory = $project->laborCosts()
            ->whereNotNull('cost_category')
            ->get()
            ->groupBy('cost_category')
            ->map(function ($costs, $category) {
                return [
                    'category' => $category,
                    'total_cost' => $costs->sum('total_cost'),
                    'total_hours' => $costs->sum('hours_worked'),
                ];
            })
            ->values();

        return [
            'total' => $totalLabor,
            'internal_labor' => $internalLabor,
            'contractor_cost' => $contractorCost,
            'percentage_internal' => $totalLabor > 0 ? ($internalLabor / $totalLabor) * 100 : 0,
            'percentage_contractor' => $totalLabor > 0 ? ($contractorCost / $totalLabor) * 100 : 0,
            'by_worker' => $byWorker,
            'by_contractor' => $byContractor,
            'by_category' => $byCategory,
        ];
    }

    /**
     * Get labor costs for period
     */
    public function getLaborCostsInPeriod(
        Project $project,
        \DateTime $startDate,
        \DateTime $endDate
    ): Collection {
        return $project->laborCosts()
            ->with(['worker', 'contractor'])
            ->whereBetween('work_date', [$startDate, $endDate])
            ->orderBy('work_date')
            ->get();
    }

    /**
     * Get monthly labor cost summary
     */
    public function getMonthlySummary(Project $project, int $year, int $month): array
    {
        $costs = $project->laborCosts()
            ->with(['worker', 'contractor'])
            ->whereYear('work_date', $year)
            ->whereMonth('work_date', $month)
            ->get();

        $internalCosts = $costs->where('cost_type', LaborCostType::InternalLabor);
        $contractorCosts = $costs->whereIn('cost_type', [
            LaborCostType::Contractor,
            LaborCostType::Subcontractor,
        ]);

        return [
            'year' => $year,
            'month' => $month,
            'total_cost' => $costs->sum('total_cost'),
            'internal_cost' => $internalCosts->sum('total_cost'),
            'contractor_cost' => $contractorCosts->sum('total_cost'),
            'total_hours' => $internalCosts->sum('hours_worked'),
            'total_records' => $costs->count(),
            'unique_workers' => $internalCosts->pluck('worker_id')->unique()->count(),
            'unique_contractors' => $contractorCosts->pluck('contractor_id')->unique()->count(),
            'pending_invoices_count' => $contractorCosts->where('is_invoiced', false)->count(),
            'pending_invoices_amount' => $contractorCosts->where('is_invoiced', false)->sum('total_cost'),
        ];
    }

    /**
     * Get worker performance on project
     */
    public function getWorkerPerformance(Project $project, Worker $worker): array
    {
        $costs = $project->laborCosts()
            ->where('worker_id', $worker->id)
            ->get();

        $regularHours = $costs->where('is_overtime', false)->where('is_holiday', false);
        $overtimeHours = $costs->where('is_overtime', true);
        $holidayHours = $costs->where('is_holiday', true);

        return [
            'total_hours' => $costs->sum('hours_worked'),
            'regular_hours' => $regularHours->sum('hours_worked'),
            'overtime_hours' => $overtimeHours->sum('hours_worked'),
            'holiday_hours' => $holidayHours->sum('hours_worked'),
            'total_cost' => $costs->sum('total_cost'),
            'average_hourly_rate' => $costs->avg('unit_rate'),
            'days_worked' => $costs->pluck('work_date')->unique()->count(),
            'first_work_date' => $costs->min('work_date'),
            'last_work_date' => $costs->max('work_date'),
        ];
    }

    /**
     * Delete labor cost and update project actual cost
     */
    public function deleteLaborCost(ProjectLaborCost $laborCost): bool
    {
        return DB::transaction(function () use ($laborCost) {
            $project = $laborCost->project;
            $deleted = $laborCost->delete();

            if ($deleted) {
                $this->updateProjectActualCost($project);
            }

            return $deleted;
        });
    }

    /**
     * Mark contractor costs as invoiced
     */
    public function markAsInvoiced(
        array $laborCostIds,
        string $invoiceNumber,
        \DateTime $invoiceDate
    ): int {
        return ProjectLaborCost::whereIn('id', $laborCostIds)
            ->contractorLabor()
            ->update([
                'is_invoiced' => true,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $invoiceDate,
            ]);
    }
}
