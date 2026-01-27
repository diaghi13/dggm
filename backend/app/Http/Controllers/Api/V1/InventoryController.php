<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Inventory\AdjustInventoryAction;
use App\Data\InventoryData;
use App\Data\StockMovementData;
use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Queries\Inventory\GetInventoryByProductQuery;
use App\Queries\Inventory\GetInventoryByWarehouseQuery;
use App\Queries\Inventory\GetInventoryQuery;
use App\Queries\Inventory\GetLowStockItemsQuery;
use App\Queries\Inventory\GetStockValuationQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;

class InventoryController extends Controller
{
    /**
     * Display a listing of inventory
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $query = new GetInventoryQuery(
            warehouseId: $request->input('warehouse_id'),
            productId: $request->input('product_id'),
            lowStock: $request->boolean('low_stock'),
            search: $request->input('search'),
        );

        $inventory = $query->execute();

        return response()->json([
            'success' => true,
            'data' => InventoryData::collect($inventory, DataCollection::class),
        ]);
    }

    /**
     * Get inventory for specific warehouse
     */
    public function byWarehouse(int $warehouseId): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $query = new GetInventoryByWarehouseQuery($warehouseId);
        $inventory = $query->execute();

        return response()->json([
            'success' => true,
            'data' => InventoryData::collect($inventory, DataCollection::class),
        ]);
    }

    /**
     * Get inventory for specific product
     */
    public function byProduct(int $productId): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $query = new GetInventoryByProductQuery($productId);
        $inventory = $query->execute();

        return response()->json([
            'success' => true,
            'data' => InventoryData::collect($inventory, DataCollection::class),
        ]);
    }

    /**
     * Get low stock items
     */
    public function lowStock(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $query = new GetLowStockItemsQuery($request->input('warehouse_id'));
        $items = $query->execute();

        return response()->json([
            'success' => true,
            'data' => InventoryData::collect($items, DataCollection::class),
        ]);
    }

    /**
     * Get stock valuation
     */
    public function valuation(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inventory::class);

        $query = new GetStockValuationQuery($request->input('warehouse_id'));
        $valuation = $query->execute();

        return response()->json([
            'success' => true,
            'data' => $valuation,
        ]);
    }

    /**
     * Adjust stock
     */
    public function adjust(Request $request, AdjustInventoryAction $action): JsonResponse
    {
        $this->authorize('create', Inventory::class);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $action->execute(
                $validated['product_id'],
                $validated['warehouse_id'],
                $validated['quantity'],
                $validated['unit_cost'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock adjusted successfully',
                'data' => StockMovementData::from($movement),
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
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'minimum_stock' => 'required|numeric|min:0',
        ]);

        $inventory = Inventory::firstOrCreate(
            [
                'product_id' => $validated['product_id'],
                'warehouse_id' => $validated['warehouse_id'],
            ],
            [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
                'quantity_in_transit' => 0,
                'quantity_quarantine' => 0,
            ]
        );

        $inventory->minimum_stock = $validated['minimum_stock'];
        $inventory->save();

        return response()->json([
            'success' => true,
            'message' => 'Minimum stock updated successfully',
            'data' => InventoryData::from($inventory),
        ]);
    }

    /**
     * Update maximum stock level
     */
    public function updateMaximumStock(Request $request): JsonResponse
    {
        $this->authorize('create', Inventory::class);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'maximum_stock' => 'required|numeric|min:0',
        ]);

        $inventory = Inventory::firstOrCreate(
            [
                'product_id' => $validated['product_id'],
                'warehouse_id' => $validated['warehouse_id'],
            ],
            [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
                'quantity_in_transit' => 0,
                'quantity_quarantine' => 0,
            ]
        );

        $inventory->maximum_stock = $validated['maximum_stock'];
        $inventory->save();

        return response()->json([
            'success' => true,
            'message' => 'Maximum stock updated successfully',
            'data' => InventoryData::from($inventory),
        ]);
    }
}
