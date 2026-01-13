<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SiteService
{
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Site::with(['customer', 'projectManager']);

        // Apply filters
        if (! empty($filters['status'])) {
            $query->ofStatus($filters['status']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (! empty($filters['project_manager_id'])) {
            $query->forProjectManager($filters['project_manager_id']);
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

    public function create(array $data): Site
    {
        return Site::create($data);
    }

    public function update(Site $site, array $data): Site
    {
        $site->update($data);

        return $site->fresh(['customer', 'projectManager']);
    }

    public function delete(Site $site): bool
    {
        return $site->delete();
    }

    private function applySearch($query, string $search): void
    {
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('city', 'like', "%{$search}%")
                ->orWhere('address', 'like', "%{$search}%");
        });
    }
}
