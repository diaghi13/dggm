<?php

namespace App\Http\Controllers\Api\V1\Warehouses;

use App\Domains\Warehouse\Actions\Warehouse\CreateWarehouseAction;
use App\Domains\Warehouse\Actions\Warehouse\DeleteWarehouseAction;
use App\Domains\Warehouse\Actions\Warehouse\UpdateWarehouseAction;
use App\Domains\Warehouse\Data\WarehouseData;
use App\Domains\Warehouse\Models\Warehouse;
use App\Domains\Warehouse\Queries\Warehouse\GetWarehouseInventoryQuery;
use App\Domains\Warehouse\Queries\Warehouse\GetWarehousesWithLowStockQuery;
use App\Http\Controllers\Controller;
use App\Http\Resources\WarehouseResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\PaginatedDataCollection;

class WarehouseController extends Controller
{
    /**
     * Display a listing of warehouses
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Warehouse::class);

        $filters = $request->only(['is_active', 'type', 'search']);
        $perPage = (int) $request->get('per_page', 20);

        $warehouses = \App\Domains\Warehouse\Queries\Warehouse\GetWarehouseQuery::execute($filters, $perPage);

        return response()->json([
            'success' => true,
            ...WarehouseData::collect($warehouses, PaginatedDataCollection::class)->toArray(),
        ]);
    }

    /**
     * Store a newly created warehouse
     */
    public function store(WarehouseData $data, CreateWarehouseAction $action): JsonResponse
    {
        $this->authorize('create', Warehouse::class);

        $warehouse = $action->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'Warehouse created successfully',
            'data' => WarehouseData::from($warehouse),
        ], 201);
    }

    /**
     * Display the specified warehouse
     */
    public function show(Warehouse $warehouse): JsonResponse
    {
        $this->authorize('view', $warehouse);

        $warehouse->load(['manager']);

        return response()->json([
            'success' => true,
            'data' => WarehouseData::from($warehouse)
                ->include('total_value'),
        ]);
    }

    /**
     * Update the specified warehouse
     */
    public function update(WarehouseData $data, Warehouse $warehouse, UpdateWarehouseAction $action): JsonResponse
    {
        $this->authorize('update', $warehouse);

        $updated = $action->execute($warehouse->id, $data);

        return response()->json([
            'success' => true,
            'message' => 'Warehouse updated successfully',
            'data' => WarehouseData::from($updated),
        ]);
    }

    /**
     * Remove the specified warehouse
     */
    public function destroy(Warehouse $warehouse, DeleteWarehouseAction $action): JsonResponse
    {
        $this->authorize('delete', $warehouse);

        try {
            $action->execute($warehouse->id);

            return response()->json([
                'success' => true,
                'message' => 'Warehouse deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get warehouse inventory (query complessa → Query Class)
     */
    public function getInventory(Request $request, Warehouse $warehouse): JsonResponse
    {
        $this->authorize('view', $warehouse);

        $filters = $request->only(['low_stock', 'search', 'product_id']);

        // Query complessa: usa Query Class
        $query = new GetWarehouseInventoryQuery($warehouse);
        $inventory = $query->execute($filters);

        return response()->json([
            'success' => true,
            'data' => $inventory,
        ]);
    }

    /**
     * Get warehouses with low stock (query complessa → Query Class)
     */
    public function lowStock(): JsonResponse
    {
        $this->authorize('viewAny', Warehouse::class);

        // Query complessa: usa Query Class
        $query = new GetWarehousesWithLowStockQuery;
        $warehouses = $query->execute();

        return response()->json([
            'success' => true,
            'data' => WarehouseResource::collection($warehouses),
        ]);
    }
}
