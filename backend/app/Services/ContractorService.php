<?php

namespace App\Services;

use App\Enums\ContractorType;
use App\Models\Contractor;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ContractorService
{
    /**
     * Get paginated contractors list with filters
     */
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Contractor::query()->with(['rates']);

        $this->applyFilters($query, $filters);

        return $query->orderBy('company_name')->paginate($perPage);
    }

    /**
     * Get contractor by ID with relationships
     */
    public function getById(int $id, array $with = []): Contractor
    {
        $defaultWith = ['rates', 'workers'];
        $with = array_merge($defaultWith, $with);

        return Contractor::with($with)->findOrFail($id);
    }

    /**
     * Create new contractor
     */
    public function create(array $data): Contractor
    {
        return DB::transaction(function () use ($data) {
            $rates = $data['rates'] ?? [];
            unset($data['rates']);

            $contractor = Contractor::create($data);

            // Create initial rates
            if (! empty($rates)) {
                foreach ($rates as $rate) {
                    $contractor->rates()->create($rate);
                }
            }

            return $contractor->load('rates');
        });
    }

    /**
     * Update contractor
     */
    public function update(Contractor $contractor, array $data): Contractor
    {
        unset($data['rates']); // Rates updated separately
        $contractor->update($data);

        return $contractor->fresh(['rates', 'workers']);
    }

    /**
     * Delete contractor
     */
    public function delete(Contractor $contractor): bool
    {
        // Check if contractor has workers or labor costs
        $hasWorkers = $contractor->workers()->exists();
        $hasLaborCosts = $contractor->laborCosts()->exists();

        if ($hasWorkers || $hasLaborCosts) {
            throw new \Exception('Cannot delete contractor with existing workers or labor costs. Consider deactivating instead.');
        }

        return $contractor->delete();
    }

    /**
     * Deactivate contractor
     */
    public function deactivate(Contractor $contractor): Contractor
    {
        $contractor->update(['is_active' => false]);

        return $contractor->fresh();
    }

    /**
     * Reactivate contractor
     */
    public function reactivate(Contractor $contractor): Contractor
    {
        $contractor->update(['is_active' => true]);

        return $contractor->fresh();
    }

    /**
     * Get contractors by type
     */
    public function getByType(ContractorType $type): Collection
    {
        return Contractor::query()
            ->byType($type)
            ->active()
            ->with('rates')
            ->get();
    }

    /**
     * Get contractors with specific specialization
     */
    public function getBySpecialization(string $specialization): Collection
    {
        return Contractor::query()
            ->withSpecialization($specialization)
            ->active()
            ->with('rates')
            ->get();
    }

    /**
     * Get contractor statistics
     */
    public function getStatistics(Contractor $contractor): array
    {
        return [
            'total_workers' => $contractor->workers()->count(),
            'active_workers' => $contractor->workers()->active()->count(),
            'total_invoiced' => $contractor->total_invoiced,
            'pending_invoices_amount' => $contractor->pending_invoices_amount,
            'total_labor_costs' => $contractor->laborCosts()->sum('total_cost') ?? 0,
            'current_rates' => $contractor->getCurrentRates(),
        ];
    }

    /**
     * Get contractor's work history (sites worked on)
     */
    public function getWorkHistory(Contractor $contractor): Collection
    {
        return $contractor->laborCosts()
            ->with('site')
            ->select('site_id')
            ->selectRaw('SUM(total_cost) as total_cost')
            ->selectRaw('MIN(work_date) as first_date')
            ->selectRaw('MAX(work_date) as last_date')
            ->selectRaw('COUNT(*) as entries_count')
            ->groupBy('site_id')
            ->orderByDesc('last_date')
            ->get()
            ->map(function ($record) {
                return [
                    'site' => $record->site,
                    'total_cost' => $record->total_cost,
                    'first_date' => $record->first_date,
                    'last_date' => $record->last_date,
                    'entries_count' => $record->entries_count,
                ];
            });
    }

    /**
     * Get pending invoices for contractor
     */
    public function getPendingInvoices(Contractor $contractor): Collection
    {
        return $contractor->laborCosts()
            ->with('site')
            ->where('is_invoiced', false)
            ->orderBy('work_date')
            ->get();
    }

    /**
     * Apply filters to query
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('vat_number', 'like', "%{$search}%");
            });
        }

        if (isset($filters['contractor_type'])) {
            $query->where('contractor_type', $filters['contractor_type']);
        }

        if (isset($filters['is_active'])) {
            if ($filters['is_active']) {
                $query->active();
            } else {
                $query->where('is_active', false);
            }
        }

        if (isset($filters['specialization'])) {
            $query->withSpecialization($filters['specialization']);
        }
    }
}
