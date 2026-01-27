<?php

namespace App\Domains\Warehouse\Services;

use App\Actions\Warehouse\CreateWarehouseAction;
use App\Actions\Warehouse\DeleteWarehouseAction;
use App\Actions\Warehouse\UpdateWarehouseAction;
use App\Data\WarehouseData;
use App\Domains\Warehouse\Queries\GetLowStockWarehousesQuery;
use App\Domains\Warehouse\Queries\GetWarehouseInventoryQuery;
use App\Domains\Warehouse\Repositories\WarehouseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

/**
 * WarehouseService
 *
 * Orchestrazione delle operazioni sul dominio Warehouse.
 * Il Service coordina Actions, Queries e Repository.
 *
 * Pattern DDD applicato:
 * - Service = Orchestratore (coordina Actions/Queries)
 * - Actions = Comandi (Create/Update/Delete)
 * - Queries = Query complesse riutilizzabili
 * - Repository = Accesso dati
 * - DTO = Data Transfer Objects
 */
class WarehouseService
{
    public function __construct(
        private readonly WarehouseRepository $repository,
        private readonly CreateWarehouseAction $createAction,
        private readonly UpdateWarehouseAction $updateAction,
        private readonly DeleteWarehouseAction $deleteAction,
        private readonly GetLowStockWarehousesQuery $lowStockQuery
    ) {}

    /**
     * Get all warehouses with optional filters and pagination
     */
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->repository->getAll($filters, $perPage);
    }

    /**
     * Get a single warehouse with all relationships (returns DTO)
     */
    public function getById(int $id): WarehouseData
    {
        $warehouse = $this->repository->getWithRelations($id);

        return WarehouseData::from($warehouse);
    }

    /**
     * Create a new warehouse (accepts array or DTO, returns DTO)
     */
    public function create(array|WarehouseData $data): WarehouseData
    {
        $dto = $data instanceof WarehouseData ? $data : WarehouseData::fromRequest($data);

        $warehouse = $this->createAction->execute($dto);

        return WarehouseData::from($warehouse);
    }

    /**
     * Update an existing warehouse (accepts array or DTO, returns DTO)
     */
    public function update(int $id, array|WarehouseData $data): WarehouseData
    {
        $dto = $data instanceof WarehouseData ? $data : WarehouseData::fromRequest($data);

        $warehouse = $this->updateAction->execute($id, $dto);

        return WarehouseData::from($warehouse);
    }

    /**
     * Delete a warehouse
     */
    public function delete(int $id): bool
    {
        return $this->deleteAction->execute($id);
    }

    /**
     * Get warehouse inventory with filters
     */
    public function getInventory(int $warehouseId, array $filters = []): Collection
    {
        $warehouse = $this->repository->findOrFail($warehouseId);

        $query = new GetWarehouseInventoryQuery($warehouse);

        return $query->execute($filters);
    }

    /**
     * Get all warehouses with low stock items
     */
    public function getWarehousesWithLowStock(): Collection
    {
        return $this->lowStockQuery->execute();
    }

    /**
     * Check if warehouse can be deleted
     */
    public function canDelete(int $id): bool
    {
        return ! $this->repository->hasInventory($id);
    }
}
