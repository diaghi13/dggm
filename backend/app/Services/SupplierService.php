<?php

namespace App\Services;

use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SupplierService
{
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Supplier::query();

        // Apply filters
        if (isset($filters['is_active']) && $filters['is_active'] !== null) {
            $query->where('is_active', $filters['is_active']);
        }

        if (! empty($filters['supplier_type'])) {
            $query->where('supplier_type', $filters['supplier_type']);
        }

        if (! empty($filters['personnel_type'])) {
            $query->where('personnel_type', $filters['personnel_type']);
        }

        if (! empty($filters['specialization'])) {
            $query->whereJsonContains('specializations', $filters['specialization']);
        }

        if (! empty($filters['search'])) {
            $this->applySearch($query, $filters['search']);
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate(min($perPage, 100));
    }

    public function create(array $data): Supplier
    {
        return Supplier::create($data);
    }

    public function update(Supplier $supplier, array $data): Supplier
    {
        $supplier->update($data);

        return $supplier->fresh();
    }

    public function delete(Supplier $supplier): bool
    {
        return $supplier->delete();
    }

    private function applySearch($query, string $search): void
    {
        $query->where(function ($q) use ($search) {
            $q->where('company_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('vat_number', 'like', "%{$search}%")
                ->orWhere('tax_code', 'like', "%{$search}%")
                ->orWhere('contact_person', 'like', "%{$search}%");
        });
    }
}
