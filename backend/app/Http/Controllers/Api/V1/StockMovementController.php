<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Inventory\AdjustInventoryAction;
use App\Actions\StockMovement\ReverseStockMovementAction;
use App\Data\StockMovementData;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Queries\StockMovement\GetMovementHistoryByProductQuery;
use App\Queries\StockMovement\GetRentalHistoryQuery;
use App\Queries\StockMovement\GetStockMovementsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;

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
            siteId: $request->input('site_id'),
            type: $type,
            dateFrom: $request->input('date_from'),
            dateTo: $request->input('date_to'),
            search: $request->input('search'),
            perPage: $request->input('per_page', 20),
        );

        $movements = $query->execute();

        return response()->json([
            'success' => true,
            'data' => StockMovementData::collect($movements->items(), DataCollection::class),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ],
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
            siteId: $request->input('site_id'),
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
}
