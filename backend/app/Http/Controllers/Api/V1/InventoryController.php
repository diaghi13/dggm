<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryResource;
use App\Models\Inventory;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {}

    /**
     * Display a listing of inventory
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $filters = $request->only([
            'warehouse_id',
            'material_id',
            'low_stock',
            'search',
        ]);

        $inventory = $this->inventoryService->getAll($filters);

        return response()->json([
            'success' => true,
            'data' => InventoryResource::collection($inventory),
        ]);
    }

    /**
     * Get inventory for specific warehouse
     */
    public function byWarehouse(int $warehouseId): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $inventory = $this->inventoryService->getByWarehouse($warehouseId);

        return response()->json([
            'success' => true,
            'data' => InventoryResource::collection($inventory),
        ]);
    }

    /**
     * Get inventory for specific material
     */
    public function byMaterial(int $materialId): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $inventory = $this->inventoryService->getByMaterial($materialId);

        return response()->json([
            'success' => true,
            'data' => InventoryResource::collection($inventory),
        ]);
    }

    /**
     * Get low stock items
     */
    public function lowStock(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $warehouseId = $request->input('warehouse_id');
        $items = $this->inventoryService->getLowStockItems($warehouseId);

        return response()->json([
            'success' => true,
            'data' => InventoryResource::collection($items),
        ]);
    }

    /**
     * Get stock valuation
     */
    public function valuation(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $warehouseId = $request->input('warehouse_id');
        $valuation = $this->inventoryService->getStockValuation($warehouseId);

        return response()->json([
            'success' => true,
            'data' => $valuation,
        ]);
    }

    /**
     * Adjust stock
     */
    public function adjust(Request $request): JsonResponse
    {
        $this->authorize('create', Inventory::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $this->inventoryService->adjustStock(
                $validated['material_id'],
                $validated['warehouse_id'],
                $validated['quantity'],
                $validated['unit_cost'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock adjusted successfully',
                'data' => $movement,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update minimum stock level
     */
    public function updateMinimumStock(Request $request): JsonResponse
    {
        $this->authorize('create', Inventory::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'minimum_stock' => 'required|numeric|min:0',
        ]);

        $inventory = $this->inventoryService->updateMinimumStock(
            $validated['material_id'],
            $validated['warehouse_id'],
            $validated['minimum_stock']
        );

        return response()->json([
            'success' => true,
            'message' => 'Minimum stock updated successfully',
            'data' => new InventoryResource($inventory),
        ]);
    }
}
