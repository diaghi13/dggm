<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerService
{
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Customer::query();

        // Apply filters
        if (! empty($filters['type'])) {
            $query->ofType($filters['type']);
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== null) {
            $query->where('is_active', $filters['is_active']);
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

    public function create(array $data): Customer
    {
        // Set defaults for non-nullable fields with defaults
        $data['payment_terms'] = $data['payment_terms'] ?? 0;
        $data['discount_percentage'] = $data['discount_percentage'] ?? 0;
        $data['country'] = $data['country'] ?? 'IT';
        $data['is_active'] = $data['is_active'] ?? true;

        return Customer::create($data);
    }

    public function update(Customer $customer, array $data): Customer
    {
        // Set defaults for non-nullable fields with defaults if they are null
        if (isset($data['payment_terms']) && $data['payment_terms'] === null) {
            $data['payment_terms'] = '30';
        }
        if (isset($data['discount_percentage']) && $data['discount_percentage'] === null) {
            $data['discount_percentage'] = 0;
        }
        if (isset($data['country']) && $data['country'] === null) {
            $data['country'] = 'IT';
        }

        $customer->update($data);

        return $customer->fresh();
    }

    public function delete(Customer $customer): bool
    {
        return $customer->delete();
    }

    private function applySearch($query, string $search): void
    {
        $query->where(function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('company_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('vat_number', 'like', "%{$search}%")
                ->orWhere('tax_code', 'like', "%{$search}%");
        });
    }
}
