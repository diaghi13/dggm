<?php

namespace App\Http\Controllers\Api\V1\Warehouses;

use App\Domains\Warehouse\Actions\Inventory\AdjustInventoryAction;
use App\Domains\Warehouse\Actions\Inventory\TransferInventoryAction;
use App\Domains\Warehouse\Actions\StockMovement\RentalOutAction;
use App\Domains\Warehouse\Actions\StockMovement\RentalReturnAction;
use App\Domains\Warehouse\Actions\StockMovement\ReverseStockMovementAction;
use App\Domains\Warehouse\Data\StockMovementData;
use App\Domains\Warehouse\Models\StockMovement;
use App\Domains\Warehouse\Queries\StockMovement\GetMovementHistoryByProductQuery;
use App\Domains\Warehouse\Queries\StockMovement\GetRentalHistoryQuery;
use App\Domains\Warehouse\Queries\StockMovement\GetStockMovementsQuery;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\PaginatedDataCollection;

class StockMovementController extends Controller
{
    /**
     * Display movement history with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockMovement::class);

        $type = $request->input('type') ? StockMovementType::tryFrom($request->input('type')) : null;

        $query = new GetStockMovementsQuery(
            productId: $request->input('product_id'),
            warehouseId: $request->input('warehouse_id'),
            projectId: $request->input('project_id'),
            type: $type,
            dateFrom: $request->input('date_from'),
            dateTo: $request->input('date_to'),
            search: $request->input('search'),
            perPage: $request->input('per_page', 20),
        );

        $movements = $query->execute();

        return response()->json([
            'success' => true,
            ...StockMovementData::collect($movements, PaginatedDataCollection::class)->toArray(),
        ]);
    }

    /**
     * Get movement history for specific product
     */
    public function byProduct(int $productId, Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockMovement::class);

        $query = new GetMovementHistoryByProductQuery(
            $productId,
            $request->input('limit')
        );

        $movements = $query->execute();

        return response()->json([
            'success' => true,
            'data' => StockMovementData::collect($movements, DataCollection::class),
        ]);
    }

    /**
     * Get rental history
     */
    public function rentalHistory(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockMovement::class);

        $query = new GetRentalHistoryQuery(
            productId: $request->input('product_id'),
            projectId: $request->input('project_id'),
            activeOnly: $request->boolean('active_only', false),
        );

        $rentals = $query->execute();

        return response()->json([
            'success' => true,
            'data' => StockMovementData::collect($rentals, DataCollection::class),
        ]);
    }

    /**
     * Reverse a stock movement
     */
    public function reverse(
        int $movementId,
        Request $request,
        ReverseStockMovementAction $action
    ): JsonResponse {
        $this->authorize('create', StockMovement::class);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $reversingMovement = $action->execute($movementId, $validated['reason']);

            return response()->json([
                'success' => true,
                'message' => 'Stock movement reversed successfully',
                'data' => StockMovementData::from($reversingMovement),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function intake(Request $request, AdjustInventoryAction $action)
    {
        $this->authorize('create', StockMovement::class);

        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'quantity' => ['required', 'numeric'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $action->execute(
                productId: $request->input('product_id'),
                warehouseId: $request->input('warehouse_id'),
                adjustment: $request->input('quantity'),
                unitCost: $request->input('unit_cost'),
                notes: $request->input('notes'),
                referenceDocument: $request->input('reference'),
                type: StockMovementType::INTAKE,
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock intake recorded successfully',
                'data' => StockMovementData::from($movement),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function output(Request $request, AdjustInventoryAction $action): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $action->execute(
                productId: $request->input('product_id'),
                warehouseId: $request->input('warehouse_id'),
                adjustment: -abs($request->input('quantity')),
                unitCost: $request->input('unit_cost'),
                notes: $request->input('notes'),
                referenceDocument: $request->input('reference'),
                type: StockMovementType::OUTPUT,
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock output recorded successfully',
                'data' => StockMovementData::from($movement),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function transfer(Request $request, TransferInventoryAction $action): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'from_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'to_warehouse_id' => ['required', 'integer', 'exists:warehouses,id', 'different:from_warehouse_id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $action->execute(
                productId: $request->input('product_id'),
                fromWarehouseId: $request->input('from_warehouse_id'),
                toWarehouseId: $request->input('to_warehouse_id'),
                quantity: $request->input('quantity'),
                unitCost: $request->input('unit_cost'),
                notes: $request->input('notes'),
                referenceDocument: $request->input('reference'),
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock transfer recorded successfully',
                'data' => StockMovementData::from($movement),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function rentalOut(Request $request, RentalOutAction $action): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'ddt_id' => ['nullable', 'integer', 'exists:ddts,id'],
            'reservation_id' => ['nullable', 'integer', 'exists:inventory_reservations,id'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $action->execute(
                productId: $request->input('product_id'),
                warehouseId: $request->input('warehouse_id'),
                quantity: $request->input('quantity'),
                projectId: $request->input('project_id'),
                ddtId: $request->input('ddt_id'),
                reservationId: $request->input('reservation_id'),
                unitCost: $request->input('unit_cost'),
                notes: $request->input('notes'),
                referenceDocument: $request->input('reference'),
            );

            return response()->json([
                'success' => true,
                'message' => 'Rental out recorded successfully',
                'data' => StockMovementData::from($movement),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function rentalReturn(Request $request, RentalReturnAction $action): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'ddt_id' => ['nullable', 'integer', 'exists:ddts,id'],
            'reservation_id' => ['nullable', 'integer', 'exists:inventory_reservations,id'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $action->execute(
                productId: $request->input('product_id'),
                warehouseId: $request->input('warehouse_id'),
                quantity: $request->input('quantity'),
                projectId: $request->input('project_id'),
                ddtId: $request->input('ddt_id'),
                reservationId: $request->input('reservation_id'),
                notes: $request->input('notes'),
                referenceDocument: $request->input('reference'),
            );

            return response()->json([
                'success' => true,
                'message' => 'Rental return recorded successfully',
                'data' => StockMovementData::from($movement),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function deliverToProject(Request $request, AdjustInventoryAction $action): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $action->execute(
                productId: $request->input('product_id'),
                warehouseId: $request->input('warehouse_id'),
                adjustment: -abs($request->input('quantity')),
                unitCost: $request->input('unit_cost'),
                notes: $request->input('notes'),
                referenceDocument: $request->input('reference'),
                type: StockMovementType::SITE_ALLOCATION,
                projectId: $request->input('project_id'),
            );

            return response()->json([
                'success' => true,
                'message' => 'Material delivered to project successfully',
                'data' => StockMovementData::from($movement),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function returnFromProject(Request $request, AdjustInventoryAction $action): JsonResponse
    {
        $this->authorize('create', StockMovement::class);

        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $action->execute(
                productId: $request->input('product_id'),
                warehouseId: $request->input('warehouse_id'),
                adjustment: abs($request->input('quantity')),
                notes: $request->input('notes'),
                referenceDocument: $request->input('reference'),
                type: StockMovementType::SITE_RETURN,
                projectId: $request->input('project_id'),
            );

            return response()->json([
                'success' => true,
                'message' => 'Material returned from project successfully',
                'data' => StockMovementData::from($movement),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
