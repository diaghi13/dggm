<?php

namespace App\Domains\Warehouse\Repositories;

use App\Data\WarehouseData;
use App\Models\Warehouse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * WarehouseEloquentRepository
 *
 * Implementazione Eloquent del WarehouseRepository.
 * Gestisce tutte le operazioni di accesso al database.
 */
class WarehouseEloquentRepository implements WarehouseRepository
{
    public function find(int $id): ?Warehouse
    {
        return Warehouse::find($id);
    }

    public function findOrFail(int $id): Warehouse
    {
        return Warehouse::findOrFail($id);
    }

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

    public function create(WarehouseData $data): Warehouse
    {
        // Rimuove computed properties prima del salvataggio
        $attributes = collect($data->toArray())
            ->except(['id', 'full_address', 'total_value'])
            ->toArray();

        return Warehouse::create($attributes);
    }

    public function update(int $id, WarehouseData $data): Warehouse
    {
        $warehouse = $this->findOrFail($id);

        // Rimuove computed properties
        $attributes = collect($data->toArray())
            ->except(['id', 'full_address', 'total_value'])
            ->toArray();

        $warehouse->update($attributes);

        return $warehouse->fresh(['manager']);
    }

    public function delete(int $id): bool
    {
        $warehouse = $this->findOrFail($id);

        return $warehouse->delete();
    }

    public function hasInventory(int $id): bool
    {
        $warehouse = $this->findOrFail($id);

        return $warehouse->inventory()->exists();
    }

    public function getWithRelations(int $id, array $relations = []): Warehouse
    {
        $defaultRelations = ['manager', 'inventory.product'];
        $relations = array_merge($defaultRelations, $relations);

        return Warehouse::with($relations)->findOrFail($id);
    }
}
