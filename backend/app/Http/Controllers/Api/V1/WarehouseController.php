<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Warehouse\CreateWarehouseAction;
use App\Actions\Warehouse\DeleteWarehouseAction;
use App\Actions\Warehouse\UpdateWarehouseAction;
use App\Data\WarehouseData;
use App\Http\Controllers\Controller;
use App\Http\Resources\WarehouseResource;
use App\Models\Warehouse;
use App\Queries\Warehouse\GetWarehouseInventoryQuery;
use App\Queries\Warehouse\GetWarehousesWithLowStockQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\PaginatedDataCollection;

class WarehouseController extends Controller
{
    public function __construct(
        private readonly CreateWarehouseAction $createAction,
        private readonly UpdateWarehouseAction $updateAction,
        private readonly DeleteWarehouseAction $deleteAction,
    ) {}

    /**
     * Display a listing of warehouses
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Warehouse::class);

        $filters = $request->only(['is_active', 'type', 'search']);
        $perPage = (int) $request->get('per_page', 20);

        // $query = new \App\Queries\Warehouse\GetWarehouseQuery;
        $warehouses = \App\Queries\Warehouse\GetWarehouseQuery::execute($filters, $perPage);

        return response()->json([
            'success' => true,
            ...WarehouseData::collect($warehouses, PaginatedDataCollection::class)->toArray(),
        ]);
    }

    /**
     * Store a newly created warehouse
     */
    public function store(WarehouseData $data): JsonResponse
    {
        $this->authorize('create', Warehouse::class);

        $warehouse = $this->createAction->execute($data);

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
            'data' => WarehouseData::from($warehouse),
        ]);
    }

    /**
     * Update the specified warehouse
     */
    public function update(WarehouseData $data, Warehouse $warehouse): JsonResponse
    {
        $this->authorize('update', $warehouse);

        $updated = $this->updateAction->execute($warehouse->id, $data);

        return response()->json([
            'success' => true,
            'message' => 'Warehouse updated successfully',
            'data' => WarehouseData::from($updated),
        ]);
    }

    /**
     * Remove the specified warehouse
     */
    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $this->authorize('delete', $warehouse);

        try {
            $this->deleteAction->execute($warehouse->id);

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
