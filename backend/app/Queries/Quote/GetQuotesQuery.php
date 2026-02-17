<?php

namespace App\Queries\Quote;

use App\Models\Quote;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetQuotesQuery
{
    /**
     * Execute the query with filters
     *
     * @param  array{status?: string, customer_id?: int, project_manager_id?: int, is_active?: bool, search?: string, sort_by?: string, sort_order?: string, from_date?: string, to_date?: string, price_list_id?: int}  $filters
     */
    public static function execute(array $filters = [], ?int $perPage = null): LengthAwarePaginator
    {
        $query = Quote::query()
            ->with(['customer', 'projectManager', 'priceList', 'paymentTerm', 'financialResource', 'warrantyType']);

        // Filter by status
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by customer
        if (isset($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        // Filter by project manager
        if (isset($filters['project_manager_id'])) {
            $query->where('project_manager_id', $filters['project_manager_id']);
        }

        // Search by code or title
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        // Filter by date range
        if (isset($filters['from_date'])) {
            $query->where('issue_date', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->where('issue_date', '<=', $filters['to_date']);
        }

        // Filter by price list
        if (isset($filters['price_list_id'])) {
            $query->where('price_list_id', $filters['price_list_id']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $perPage ?? 15;

        return $query->paginate($perPage);
    }
}
