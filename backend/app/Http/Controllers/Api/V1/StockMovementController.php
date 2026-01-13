<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementResource;
use App\Models\StockMovement;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {}

    /**
     * Display movement history
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockMovement::class);

        $filters = $request->only([
            'material_id',
            'warehouse_id',
            'site_id',
            'type',
            'date_from',
            'date_to',
        ]);

        $movements = $this->inventoryService->getMovementHistory($filters);

        return response()->json([
            'success' => true,
            'data' => StockMovementResource::collection($movements),
        ]);
    }

    /**
     * Intake stock from supplier
     */
    public function intake(Request $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'supplier_document' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $this->inventoryService->intakeStock(
                $validated['material_id'],
                $validated['warehouse_id'],
                $validated['quantity'],
                $validated['unit_cost'],
                $validated['supplier_id'] ?? null,
                $validated['supplier_document'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock intake recorded successfully',
                'data' => new StockMovementResource($movement),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Output stock
     */
    public function output(Request $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $this->inventoryService->outputStock(
                $validated['material_id'],
                $validated['warehouse_id'],
                $validated['quantity'],
                $validated['unit_cost'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock output recorded successfully',
                'data' => new StockMovementResource($movement),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Transfer stock between warehouses
     */
    public function transfer(Request $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $this->inventoryService->transferStock(
                $validated['material_id'],
                $validated['from_warehouse_id'],
                $validated['to_warehouse_id'],
                $validated['quantity'],
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock transferred successfully',
                'data' => new StockMovementResource($movement),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Rental out
     */
    public function rentalOut(Request $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'site_id' => 'nullable|exists:sites,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $this->inventoryService->rentalOut(
                $validated['material_id'],
                $validated['warehouse_id'],
                $validated['quantity'],
                $validated['site_id'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Rental out recorded successfully',
                'data' => new StockMovementResource($movement),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Rental return
     */
    public function rentalReturn(Request $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'site_id' => 'nullable|exists:sites,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $this->inventoryService->rentalReturn(
                $validated['material_id'],
                $validated['warehouse_id'],
                $validated['quantity'],
                $validated['site_id'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Rental return recorded successfully',
                'data' => new StockMovementResource($movement),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Deliver to site
     */
    public function deliverToSite(Request $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'site_id' => 'required|exists:sites,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $this->inventoryService->deliverToSite(
                $validated['material_id'],
                $validated['warehouse_id'],
                $validated['site_id'],
                $validated['quantity'],
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock delivered to site successfully',
                'data' => new StockMovementResource($movement),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Return from site
     */
    public function returnFromSite(Request $request): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'site_id' => 'required|exists:sites,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $movement = $this->inventoryService->returnFromSite(
                $validated['material_id'],
                $validated['warehouse_id'],
                $validated['site_id'],
                $validated['quantity'],
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock returned from site successfully',
                'data' => new StockMovementResource($movement),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
