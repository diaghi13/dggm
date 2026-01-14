<?php

namespace App\Services;

use App\Enums\WorkerType;
use App\Models\Site;
use App\Models\Worker;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WorkerService
{
    /**
     * Get paginated workers list with filters
     */
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Worker::query()
            ->with(['user', 'supplier', 'payrollData']);

        $this->applyFilters($query, $filters);

        return $query->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage);
    }

    /**
     * Get worker by ID with relationships
     */
    public function getById(int $id, array $with = []): Worker
    {
        $defaultWith = ['user', 'supplier', 'payrollData', 'rates'];
        $with = array_merge($defaultWith, $with);

        return Worker::with($with)->findOrFail($id);
    }

    /**
     * Create new worker with nested data
     */
    public function create(array $data): Worker
    {
        return DB::transaction(function () use ($data) {
            // Extract nested data
            $payrollData = $data['payroll_data'] ?? null;
            $rates = $data['rates'] ?? [];
            unset($data['payroll_data'], $data['rates']);

            // Create worker
            $worker = Worker::create($data);

            // Create payroll data if employee
            if ($worker->worker_type === WorkerType::Employee && $payrollData) {
                $worker->payrollData()->create($payrollData);
            }

            // Create rates
            if (! empty($rates)) {
                foreach ($rates as $rate) {
                    $worker->rates()->create($rate);
                }
            }

            return $worker->load(['user', 'contractorCompany', 'payrollData', 'rates']);
        });
    }

    /**
     * Update worker with nested data
     */
    public function update(Worker $worker, array $data): Worker
    {
        return DB::transaction(function () use ($worker, $data) {
            // Extract nested data
            $payrollData = $data['payroll_data'] ?? null;
            unset($data['payroll_data']);

            // Update worker
            $worker->update($data);

            // Update or create payroll data if employee
            if ($worker->worker_type === WorkerType::Employee && $payrollData) {
                $worker->payrollData()->updateOrCreate(
                    ['worker_id' => $worker->id],
                    $payrollData
                );
            }

            return $worker->load(['user', 'contractorCompany', 'payrollData', 'rates']);
        });
    }

    /**
     * Delete worker
     */
    public function delete(Worker $worker): bool
    {
        return DB::transaction(function () use ($worker) {
            // Check if worker has time entries or labor costs
            $hasTimeEntries = false; // TODO: Check when TimeEntry implemented
            $hasLaborCosts = $worker->laborCosts()->exists();

            if ($hasLaborCosts) {
                throw new \Exception('Cannot delete worker with existing labor costs. Consider deactivating instead.');
            }

            return $worker->delete();
        });
    }

    /**
     * Deactivate worker (soft termination)
     */
    public function deactivate(Worker $worker, ?\DateTime $terminationDate = null): Worker
    {
        $worker->update([
            'is_active' => false,
            'termination_date' => $terminationDate ?? now(),
        ]);

        // Deactivate all active site assignments
        $worker->siteAssignments()
            ->where('is_active', true)
            ->whereNull('assigned_to')
            ->update([
                'is_active' => false,
                'assigned_to' => $terminationDate ?? now(),
            ]);

        return $worker->fresh();
    }

    /**
     * Reactivate worker
     */
    public function reactivate(Worker $worker): Worker
    {
        $worker->update([
            'is_active' => true,
            'termination_date' => null,
        ]);

        return $worker->fresh();
    }

    /**
     * Assign worker to site
     */
    public function assignToSite(Worker $worker, int $siteId, array $data): void
    {
        $site = Site::findOrFail($siteId);

        // Check if already assigned
        $existing = $worker->siteAssignments()
            ->where('site_id', $siteId)
            ->where('is_active', true)
            ->whereNull('assigned_to')
            ->first();

        if ($existing) {
            throw new \Exception('Worker is already assigned to this site.');
        }

        $worker->sites()->attach($siteId, array_merge($data, [
            'is_active' => true,
            'assigned_from' => $data['assigned_from'] ?? now(),
        ]));
    }

    /**
     * Remove worker from site
     */
    public function removeFromSite(Worker $worker, int $siteId, ?\DateTime $endDate = null): void
    {
        $assignment = $worker->siteAssignments()
            ->where('site_id', $siteId)
            ->where('is_active', true)
            ->firstOrFail();

        $assignment->update([
            'is_active' => false,
            'assigned_to' => $endDate ?? now(),
        ]);
    }

    /**
     * Get available workers (not assigned to any site or available for multiple assignments)
     */
    public function getAvailableWorkers(array $filters = []): Collection
    {
        $query = Worker::query()
            ->with(['contractorCompany', 'rates'])
            ->available();

        $this->applyFilters($query, $filters);

        return $query->get();
    }

    /**
     * Get workers assigned to a specific site
     */
    public function getWorkersBySite(int $siteId, bool $onlyActive = true): Collection
    {
        $query = Worker::query()
            ->with(['user', 'contractorCompany', 'siteAssignments' => function ($q) use ($siteId) {
                $q->where('site_id', $siteId);
            }])
            ->whereHas('sites', function ($q) use ($siteId, $onlyActive) {
                $q->where('sites.id', $siteId);
                if ($onlyActive) {
                    $q->where('site_workers.is_active', true);
                }
            });

        return $query->get();
    }

    /**
     * Get worker statistics
     */
    public function getStatistics(Worker $worker): array
    {
        return [
            'total_sites_assigned' => $worker->sites()->count(),
            'active_sites' => $worker->getActiveSites()->count(),
            'total_hours_worked' => $worker->laborCosts()->sum('hours_worked') ?? 0,
            'total_cost_generated' => $worker->laborCosts()->sum('total_cost') ?? 0,
            'average_hourly_rate' => $this->calculateAverageHourlyRate($worker),
            'current_rates' => $worker->rates()->current()->get(),
        ];
    }

    /**
     * Calculate average hourly rate from labor costs
     */
    private function calculateAverageHourlyRate(Worker $worker): ?float
    {
        $totalHours = $worker->laborCosts()->sum('hours_worked');
        $totalCost = $worker->laborCosts()->sum('total_cost');

        if (! $totalHours || $totalHours == 0) {
            return null;
        }

        return $totalCost / $totalHours;
    }

    /**
     * Apply filters to query
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('tax_code', 'like', "%{$search}%");
            });
        }

        if (isset($filters['worker_type'])) {
            $query->where('worker_type', $filters['worker_type']);
        }

        if (isset($filters['contract_type'])) {
            $query->where('contract_type', $filters['contract_type']);
        }

        if (isset($filters['is_active'])) {
            if ($filters['is_active']) {
                $query->active();
            } else {
                $query->where('is_active', false);
            }
        }

        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        if (isset($filters['has_safety_training'])) {
            if ($filters['has_safety_training']) {
                $query->withValidSafetyTraining();
            }
        }

        if (isset($filters['specialization'])) {
            $query->whereJsonContains('specializations', $filters['specialization']);
        }

        if (isset($filters['site_id'])) {
            $query->whereHas('sites', function ($q) use ($filters) {
                $q->where('sites.id', $filters['site_id']);
            });
        }
    }
}
