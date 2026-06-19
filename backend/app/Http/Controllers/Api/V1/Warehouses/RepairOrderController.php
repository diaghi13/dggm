<?php

namespace App\Http\Controllers\Api\V1\Warehouses;

use App\Data\CreateRepairOrderData;
use App\Data\QuarantinedInventoryData;
use App\Data\RepairOrderData;
use App\Data\UpdateRepairOrderStatusData;
use App\Domains\Product\Models\Product;
use App\Domains\Warehouse\Actions\Warehouse\CreateRepairOrderAction;
use App\Domains\Warehouse\Actions\Warehouse\UpdateRepairOrderStatusAction;
use App\Domains\Warehouse\Queries\Warehouse\GetQuarantinedInventoryQuery;
use App\Domains\Warehouse\Queries\Warehouse\GetRepairOrdersQuery;
use App\Http\Controllers\Controller;
use App\Models\RepairOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RepairOrderController extends Controller
{
    /**
     * GET /inventory/quarantine
     * List all inventory items currently in quarantine.
     */
    public function quarantine(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RepairOrder::class);

        $items = app(GetQuarantinedInventoryQuery::class)->execute();

        return response()->json([
            'success' => true,
            'data' => $items->map(fn ($item) => QuarantinedInventoryData::from($item)),
            'meta' => ['total' => $items->count()],
        ]);
    }

    /**
     * GET /repair-orders
     * List repair orders with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RepairOrder::class);

        $paginated = app(GetRepairOrdersQuery::class, [
            'filters' => $request->only(['status', 'repair_type', 'supplier_id', 'product_id', 'overdue']),
        ])->execute((int) $request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => collect($paginated->items())->map(fn ($r) => RepairOrderData::fromModel($r)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * POST /repair-orders
     * Create a new repair order.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', RepairOrder::class);

        $repairOrder = app(CreateRepairOrderAction::class)->execute(
            CreateRepairOrderData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => RepairOrderData::fromModel($repairOrder),
            'message' => 'Ordine di riparazione creato con successo',
        ], 201);
    }

    /**
     * GET /repair-orders/{repairOrder}
     * Show a single repair order.
     */
    public function show(RepairOrder $repairOrder): JsonResponse
    {
        $this->authorize('view', $repairOrder);

        $repairOrder->load('product', 'supplier', 'inventory', 'createdBy', 'resolvedBy', 'incident', 'inspectionItem');

        return response()->json([
            'success' => true,
            'data' => RepairOrderData::fromModel($repairOrder),
        ]);
    }

    /**
     * PUT /repair-orders/{repairOrder}
     * Update repair order details (notes, dates, supplier).
     */
    public function update(RepairOrder $repairOrder, Request $request): JsonResponse
    {
        $this->authorize('update', $repairOrder);

        $repairOrder->update(
            $request->only([
                'repair_type',
                'supplier_id',
                'sent_date',
                'expected_return_date',
                'repair_notes',
                'repair_cost',
            ])
        );

        $repairOrder->load('product', 'supplier', 'inventory');

        return response()->json([
            'success' => true,
            'data' => RepairOrderData::fromModel($repairOrder),
            'message' => 'Ordine di riparazione aggiornato',
        ]);
    }

    /**
     * PATCH /repair-orders/{repairOrder}/status
     * Transition repair order status, handling inventory side-effects.
     */
    public function updateStatus(RepairOrder $repairOrder, Request $request): JsonResponse
    {
        $this->authorize('updateStatus', $repairOrder);

        $repairOrder = app(UpdateRepairOrderStatusAction::class)->execute(
            $repairOrder,
            UpdateRepairOrderStatusData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => RepairOrderData::fromModel($repairOrder),
            'message' => 'Stato aggiornato con successo',
        ]);
    }

    /**
     * GET /products/{product}/repair-history
     * List all repair orders for a specific product.
     */
    public function repairHistory(Product $product): JsonResponse
    {
        $this->authorize('viewAny', RepairOrder::class);

        $repairOrders = RepairOrder::where('product_id', $product->id)
            ->with(['supplier:id,name', 'createdBy:id,name', 'resolvedBy:id,name'])
            ->withTrashed(false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $repairOrders->map(fn ($r) => RepairOrderData::fromModel($r)),
            'meta' => ['total' => $repairOrders->count()],
        ]);
    }
}
