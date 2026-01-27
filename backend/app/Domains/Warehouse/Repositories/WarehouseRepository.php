<?php

namespace App\Domains\Warehouse\Repositories;

use App\Data\WarehouseData;
use App\Models\Warehouse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * WarehouseRepository Interface
 *
 * Definisce il contratto per l'accesso ai dati del Warehouse.
 * Vantaggi:
 * - Permette di cambiare implementazione senza modificare il codice client
 * - Facilita i test (possiamo usare un FakeRepository)
 * - Separa la logica business dall'accesso dati
 */
interface WarehouseRepository
{
    /**
     * Find warehouse by ID
     */
    public function find(int $id): ?Warehouse;

    /**
     * Find warehouse by ID or fail
     */
    public function findOrFail(int $id): Warehouse;

    /**
     * Get all warehouses with filters and pagination
     */
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator;

    /**
     * Create new warehouse
     */
    public function create(WarehouseData $data): Warehouse;

    /**
     * Update existing warehouse
     */
    public function update(int $id, WarehouseData $data): Warehouse;

    /**
     * Delete warehouse
     */
    public function delete(int $id): bool;

    /**
     * Check if warehouse has inventory
     */
    public function hasInventory(int $id): bool;

    /**
     * Get warehouse with relationships
     */
    public function getWithRelations(int $id, array $relations = []): Warehouse;
}
