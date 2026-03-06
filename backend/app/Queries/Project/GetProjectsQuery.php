<?php

namespace App\Queries\Project;

use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetProjectsQuery
{
    /**
     * Execute the query with filters.
     *
     * @param  array{search?: string, status?: string, customer_id?: int, project_manager_id?: int, is_active?: bool, sort_by?: string, sort_order?: string, per_page?: int}  $filters
     */
    public static function execute(array $filters = [], ?int $perPage = null): LengthAwarePaginator
    {
        $query = Project::query()
            ->with(['customer', 'projectManager']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (! empty($filters['project_manager_id'])) {
            $query->where('project_manager_id', $filters['project_manager_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $perPage ?? ($filters['per_page'] ?? 15);

        return $query->paginate($perPage);
    }
}
