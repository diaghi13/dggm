<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWarehouseRequest;
use App\Http\Requests\UpdateWarehouseRequest;
use App\Http\Resources\WarehouseResource;
use App\Models\Warehouse;
use App\Services\WarehouseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function __construct(
        private readonly WarehouseService $warehouseService
    ) {}

    /**
     * Display a listing of warehouses
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Warehouse::class);

        $filters = $request->only([
            'is_active',
            'type',
            'search',
            'sort_field',
            'sort_direction',
        ]);

        $perPage = min($request->input('per_page', 20), 100);

        $warehouses = $this->warehouseService->getAll($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => WarehouseResource::collection($warehouses->items()),
            'meta' => [
                'current_page' => $warehouses->currentPage(),
                'last_page' => $warehouses->lastPage(),
                'per_page' => $warehouses->perPage(),
                'total' => $warehouses->total(),
            ],
        ]);
    }

    /**
     * Store a newly created warehouse
     */
    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        $warehouse = $this->warehouseService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Warehouse created successfully',
            'data' => new WarehouseResource($warehouse),
        ], 201);
    }

    /**
     * Display the specified warehouse
     */
    public function show(Warehouse $warehouse): JsonResponse
    {
        $this->authorize('view', $warehouse);

        $warehouse = $this->warehouseService->getById($warehouse->id);

        return response()->json([
            'success' => true,
            'data' => new WarehouseResource($warehouse),
        ]);
    }

    /**
     * Update the specified warehouse
     */
    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): JsonResponse
    {
        $warehouse = $this->warehouseService->update($warehouse, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Warehouse updated successfully',
            'data' => new WarehouseResource($warehouse),
        ]);
    }

    /**
     * Remove the specified warehouse
     */
    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $this->authorize('delete', $warehouse);

        try {
            $this->warehouseService->delete($warehouse);

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
     * Get warehouse inventory
     */
    public function getInventory(Request $request, Warehouse $warehouse): JsonResponse
    {
        $this->authorize('view', $warehouse);

        $filters = $request->only(['low_stock', 'search']);

        $inventory = $this->warehouseService->getInventory($warehouse, $filters);

        return response()->json([
            'success' => true,
            'data' => $inventory,
        ]);
    }
}
