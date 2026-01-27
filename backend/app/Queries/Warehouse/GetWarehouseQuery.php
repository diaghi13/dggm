<?php

namespace App\Queries\Warehouse;

use Illuminate\Pagination\LengthAwarePaginator;

class GetWarehouseQuery
{
    public static function execute(array $filters = [], $perPage = 20): LengthAwarePaginator
    {
        $query = \App\Models\Warehouse::query()
            ->with(['manager'])
            ->when(isset($filters['is_active']), fn ($q) => $q->where(
                'is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN))
            )
            ->when(isset($filters['type']), fn ($q) => $q->where(
                'type', $filters['type'])
            )
            ->when(isset($filters['search']) && $filters['search'] !== '', fn ($q) => $q->where(function ($query) use ($filters) {
                $search = $filters['search'];
                $query->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            }));

        return $query->orderBy('name')->paginate($perPage);
    }
}
