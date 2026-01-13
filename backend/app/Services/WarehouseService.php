<?php

namespace App\Services;

use App\Models\Warehouse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class WarehouseService
{
    /**
     * Get all warehouses with optional filters and pagination
     */
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Warehouse::query()->with(['manager']);

        // Filter by active status
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by type
        if (isset($filters['type']) && $filters['type'] !== '') {
            $query->where('type', $filters['type']);
        }

        // Search by code, name, city
        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortField = $filters['sort_field'] ?? 'code';
        $sortDirection = $filters['sort_direction'] ?? 'asc';
        $query->orderBy($sortField, $sortDirection);

        return $query->paginate($perPage);
    }

    /**
     * Get a single warehouse with all relationships
     */
    public function getById(int $id): Warehouse
    {
        return Warehouse::with([
            'manager',
            'inventory.material',
        ])->findOrFail($id);
    }

    /**
     * Create a new warehouse
     */
    public function create(array $data): Warehouse
    {
        return DB::transaction(function () use ($data) {
            return Warehouse::create($data);
        });
    }

    /**
     * Update an existing warehouse
     */
    public function update(Warehouse $warehouse, array $data): Warehouse
    {
        return DB::transaction(function () use ($warehouse, $data) {
            $warehouse->update($data);

            return $warehouse->fresh(['manager']);
        });
    }

    /**
     * Delete a warehouse
     */
    public function delete(Warehouse $warehouse): bool
    {
        return DB::transaction(function () use ($warehouse) {
            // Check if warehouse has inventory
            if ($warehouse->inventory()->exists()) {
                throw new \Exception('Cannot delete warehouse with existing inventory');
            }

            return $warehouse->delete();
        });
    }

    /**
     * Get warehouse inventory
     */
    public function getInventory(Warehouse $warehouse, array $filters = [])
    {
        $query = $warehouse->inventory()->with(['material']);

        // Filter low stock items
        if (isset($filters['low_stock']) && filter_var($filters['low_stock'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereRaw('quantity_available <= minimum_stock');
        }

        // Search materials
        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->whereHas('material', function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        return $query->get();
    }
}
