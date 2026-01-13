<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Models\Inventory;
use App\Models\Material;
use App\Models\Site;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Get all inventory with filters
     */
    public function getAll(array $filters = []): Collection
    {
        $query = Inventory::query()
            ->with(['material', 'warehouse']);

        // Filter by warehouse
        if (isset($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }

        // Filter by material
        if (isset($filters['material_id'])) {
            $query->where('material_id', $filters['material_id']);
        }

        // Filter low stock only
        if (isset($filters['low_stock']) && filter_var($filters['low_stock'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereRaw('quantity_available <= minimum_stock');
        }

        // Search by material name or code
        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->whereHas('material', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->get();
    }

    /**
     * Get inventory for a specific warehouse
     */
    public function getByWarehouse(int $warehouseId): Collection
    {
        return Inventory::where('warehouse_id', $warehouseId)
            ->with(['material'])
            ->get();
    }

    /**
     * Get inventory for a specific material across all warehouses
     */
    public function getByMaterial(int $materialId): Collection
    {
        return Inventory::where('material_id', $materialId)
            ->with(['warehouse'])
            ->get();
    }

    /**
     * Get low stock items
     */
    public function getLowStockItems(?int $warehouseId = null): Collection
    {
        $query = Inventory::query()
            ->whereRaw('quantity_available <= minimum_stock')
            ->with(['material', 'warehouse']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return $query->get();
    }

    /**
     * Get stock valuation (total inventory value)
     */
    public function getStockValuation(?int $warehouseId = null): array
    {
        $query = Inventory::query()
            ->join('materials', 'inventory.material_id', '=', 'materials.id');

        if ($warehouseId) {
            $query->where('inventory.warehouse_id', $warehouseId);
        }

        $result = $query->selectRaw('
            SUM(inventory.quantity_available * materials.standard_cost) as total_value,
            SUM(inventory.quantity_available) as total_units,
            COUNT(DISTINCT inventory.material_id) as unique_materials
        ')->first();

        return [
            'total_value' => (float) ($result->total_value ?? 0),
            'total_units' => (float) ($result->total_units ?? 0),
            'unique_materials' => (int) ($result->unique_materials ?? 0),
        ];
    }

    /**
     * Adjust stock (increase or decrease)
     */
    public function adjustStock(
        int $materialId,
        int $warehouseId,
        float $quantity,
        ?float $unitCost = null,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use ($materialId, $warehouseId, $quantity, $unitCost, $notes) {
            $inventory = $this->getOrCreateInventory($materialId, $warehouseId);

            // Update inventory
            $inventory->quantity_available += $quantity;
            $inventory->save();

            // Create stock movement record
            return StockMovement::create([
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::ADJUSTMENT,
                'quantity' => abs($quantity),
                'unit_cost' => $unitCost,
                'movement_date' => now(),
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Intake stock (receiving from supplier)
     */
    public function intakeStock(
        int $materialId,
        int $warehouseId,
        float $quantity,
        float $unitCost,
        ?int $supplierId = null,
        ?string $supplierDocument = null,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use ($materialId, $warehouseId, $quantity, $unitCost, $supplierId, $supplierDocument, $notes) {
            $inventory = $this->getOrCreateInventory($materialId, $warehouseId);

            // Increase stock
            $inventory->quantity_available += $quantity;
            $inventory->save();

            // Create movement record
            return StockMovement::create([
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::INTAKE,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'movement_date' => now(),
                'supplier_id' => $supplierId,
                'supplier_document' => $supplierDocument,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Output stock (sale/consumption)
     */
    public function outputStock(
        int $materialId,
        int $warehouseId,
        float $quantity,
        ?float $unitCost = null,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use ($materialId, $warehouseId, $quantity, $unitCost, $notes) {
            $inventory = Inventory::where('material_id', $materialId)
                ->where('warehouse_id', $warehouseId)
                ->firstOrFail();

            // Check sufficient stock
            if ($inventory->quantity_free < $quantity) {
                throw new \Exception('Insufficient stock available. Available: '.$inventory->quantity_free);
            }

            // Decrease stock
            $inventory->quantity_available -= $quantity;
            $inventory->save();

            // Create movement record
            return StockMovement::create([
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::OUTPUT,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'movement_date' => now(),
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Transfer stock between warehouses
     */
    public function transferStock(
        int $materialId,
        int $fromWarehouseId,
        int $toWarehouseId,
        float $quantity,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use ($materialId, $fromWarehouseId, $toWarehouseId, $quantity, $notes) {
            // Get source inventory
            $fromInventory = Inventory::where('material_id', $materialId)
                ->where('warehouse_id', $fromWarehouseId)
                ->firstOrFail();

            // Check sufficient stock
            if ($fromInventory->quantity_free < $quantity) {
                throw new \Exception('Insufficient stock for transfer. Available: '.$fromInventory->quantity_free);
            }

            // Get or create destination inventory
            $toInventory = $this->getOrCreateInventory($materialId, $toWarehouseId);

            // Update inventories
            $fromInventory->quantity_available -= $quantity;
            $fromInventory->save();

            $toInventory->quantity_available += $quantity;
            $toInventory->save();

            // Create movement record
            return StockMovement::create([
                'material_id' => $materialId,
                'warehouse_id' => $fromWarehouseId,
                'type' => StockMovementType::TRANSFER,
                'quantity' => $quantity,
                'unit_cost' => $fromInventory->material->standard_cost,
                'movement_date' => now(),
                'from_warehouse_id' => $fromWarehouseId,
                'to_warehouse_id' => $toWarehouseId,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Reserve stock for a site
     */
    public function reserveForSite(
        int $materialId,
        int $warehouseId,
        int $siteId,
        float $quantity
    ): bool {
        return DB::transaction(function () use ($materialId, $warehouseId, $quantity) {
            $inventory = Inventory::where('material_id', $materialId)
                ->where('warehouse_id', $warehouseId)
                ->firstOrFail();

            // Check availability
            if ($inventory->quantity_free < $quantity) {
                throw new \Exception('Insufficient stock to reserve. Available: '.$inventory->quantity_free);
            }

            // Reserve stock
            $inventory->quantity_reserved += $quantity;
            $inventory->save();

            return true;
        });
    }

    /**
     * Release reservation (cancel site allocation)
     */
    public function releaseReservation(
        int $materialId,
        int $warehouseId,
        float $quantity
    ): bool {
        return DB::transaction(function () use ($materialId, $warehouseId, $quantity) {
            $inventory = Inventory::where('material_id', $materialId)
                ->where('warehouse_id', $warehouseId)
                ->firstOrFail();

            $inventory->quantity_reserved = max(0, $inventory->quantity_reserved - $quantity);
            $inventory->save();

            return true;
        });
    }

    /**
     * Deliver stock to site (convert reservation to delivery)
     */
    public function deliverToSite(
        int $materialId,
        int $warehouseId,
        int $siteId,
        float $quantity,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use ($materialId, $warehouseId, $siteId, $quantity, $notes) {
            $inventory = Inventory::where('material_id', $materialId)
                ->where('warehouse_id', $warehouseId)
                ->firstOrFail();

            // Decrease available and reserved stock
            $inventory->quantity_available -= $quantity;
            $inventory->quantity_reserved = max(0, $inventory->quantity_reserved - $quantity);
            $inventory->save();

            // Create movement record
            return StockMovement::create([
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::SITE_ALLOCATION,
                'quantity' => $quantity,
                'unit_cost' => $inventory->material->standard_cost,
                'movement_date' => now(),
                'site_id' => $siteId,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Return stock from site to warehouse
     */
    public function returnFromSite(
        int $materialId,
        int $warehouseId,
        int $siteId,
        float $quantity,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use ($materialId, $warehouseId, $siteId, $quantity, $notes) {
            $inventory = $this->getOrCreateInventory($materialId, $warehouseId);

            // Increase available stock
            $inventory->quantity_available += $quantity;
            $inventory->save();

            // Create movement record
            return StockMovement::create([
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::SITE_RETURN,
                'quantity' => $quantity,
                'unit_cost' => $inventory->material->standard_cost,
                'movement_date' => now(),
                'site_id' => $siteId,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Rent out material (for rentable items)
     */
    public function rentalOut(
        int $materialId,
        int $warehouseId,
        float $quantity,
        ?int $siteId = null,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use ($materialId, $warehouseId, $quantity, $siteId, $notes) {
            $inventory = Inventory::where('material_id', $materialId)
                ->where('warehouse_id', $warehouseId)
                ->firstOrFail();

            $material = $inventory->material;

            // Check if material is rentable
            if (! $material->is_rentable) {
                throw new \Exception('Material is not rentable.');
            }

            // Check availability
            if ($material->available_stock < $quantity) {
                throw new \Exception('Insufficient stock for rental.');
            }

            // Rent out
            $material->rentOut($quantity);

            // Create movement record
            return StockMovement::create([
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::RENTAL_OUT,
                'quantity' => $quantity,
                'unit_cost' => $material->rental_price_daily,
                'movement_date' => now(),
                'site_id' => $siteId,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Return rented material
     */
    public function rentalReturn(
        int $materialId,
        int $warehouseId,
        float $quantity,
        ?int $siteId = null,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use ($materialId, $warehouseId, $quantity, $siteId, $notes) {
            $material = Material::findOrFail($materialId);

            // Return rental
            $material->rentReturn($quantity);

            // Create movement record
            return StockMovement::create([
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
                'type' => StockMovementType::RENTAL_RETURN,
                'quantity' => $quantity,
                'movement_date' => now(),
                'site_id' => $siteId,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Get or create inventory record
     */
    private function getOrCreateInventory(int $materialId, int $warehouseId): Inventory
    {
        return Inventory::firstOrCreate(
            [
                'material_id' => $materialId,
                'warehouse_id' => $warehouseId,
            ],
            [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
                'quantity_in_transit' => 0,
                'minimum_stock' => 0,
            ]
        );
    }

    /**
     * Update minimum stock level
     */
    public function updateMinimumStock(int $materialId, int $warehouseId, float $minimumStock): Inventory
    {
        $inventory = $this->getOrCreateInventory($materialId, $warehouseId);
        $inventory->minimum_stock = $minimumStock;
        $inventory->save();

        return $inventory;
    }

    /**
     * Get stock movement history
     */
    public function getMovementHistory(array $filters = []): Collection
    {
        $query = StockMovement::query()
            ->with(['material', 'warehouse', 'user', 'site', 'supplier']);

        if (isset($filters['material_id'])) {
            $query->where('material_id', $filters['material_id']);
        }

        if (isset($filters['warehouse_id'])) {
            $query->where('warehouse_id', $filters['warehouse_id']);
        }

        if (isset($filters['site_id'])) {
            $query->where('site_id', $filters['site_id']);
        }

        if (isset($filters['type'])) {
            $movementType = StockMovementType::tryFrom($filters['type']);
            if ($movementType) {
                $query->byType($movementType);
            }
        }

        if (isset($filters['date_from']) && isset($filters['date_to'])) {
            $query->inPeriod($filters['date_from'], $filters['date_to']);
        }

        return $query->orderBy('movement_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
