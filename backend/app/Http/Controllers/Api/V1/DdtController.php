<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Ddt\CancelDdtAction;
use App\Actions\Ddt\ConfirmDdtAction;
use App\Actions\Ddt\CreateDdtAction;
use App\Actions\Ddt\DeleteDdtAction;
use App\Actions\Ddt\DeliverDdtAction;
use App\Actions\Ddt\UpdateDdtAction;
use App\Data\DdtData;
use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Http\Controllers\Controller;
use App\Models\Ddt;
use App\Queries\Ddt\GetActiveDdtsBySiteQuery;
use App\Queries\Ddt\GetDdtByIdQuery;
use App\Queries\Ddt\GetDdtsQuery;
use App\Queries\Ddt\GetPendingRentalReturnsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;

class DdtController extends Controller
{
    /**
     * Display a listing of DDTs
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Ddt::class);

        $type = $request->input('type') ? DdtType::tryFrom($request->input('type')) : null;
        $status = $request->input('status') ? DdtStatus::tryFrom($request->input('status')) : null;

        $query = new GetDdtsQuery(
            type: $type,
            status: $status,
            warehouseId: $request->input('warehouse_id'),
            siteId: $request->input('site_id'),
            supplierId: $request->input('supplier_id'),
            customerId: $request->input('customer_id'),
            search: $request->input('search'),
            sortBy: $request->input('sort_by', 'ddt_date'),
            sortOrder: $request->input('sort_order', 'desc'),
            perPage: $request->input('per_page', 20),
        );

        $ddts = $query->execute();

        return response()->json([
            'success' => true,
            'data' => DdtData::collect($ddts->items(), DataCollection::class),
            'meta' => [
                'current_page' => $ddts->currentPage(),
                'last_page' => $ddts->lastPage(),
                'per_page' => $ddts->perPage(),
                'total' => $ddts->total(),
            ],
        ]);
    }

    /**
     * Store a newly created DDT
     */
    public function store(DdtData $data, CreateDdtAction $action): JsonResponse
    {
        $this->authorize('create', Ddt::class);

//        $validated = $request->validate([
//            'type' => 'required|string',
//            'ddt_number' => 'nullable|string|max:100',
//            'ddt_date' => 'required|date',
//            'from_warehouse_id' => 'nullable|exists:warehouses,id',
//            'to_warehouse_id' => 'nullable|exists:warehouses,id',
//            'supplier_id' => 'nullable|exists:suppliers,id',
//            'customer_id' => 'nullable|exists:customers,id',
//            'site_id' => 'nullable|exists:sites,id',
//            'transport_type' => 'nullable|string',
//            'carrier' => 'nullable|string|max:255',
//            'tracking_number' => 'nullable|string|max:255',
//            'num_packages' => 'nullable|integer|min:1',
//            'weight_kg' => 'nullable|numeric|min:0',
//            'notes' => 'nullable|string',
//            'items' => 'required|array|min:1',
//            'items.*.product_id' => 'required|exists:products,id',
//            'items.*.quantity' => 'required|numeric|min:0.01',
//            'items.*.unit_cost' => 'nullable|numeric|min:0',
//            'items.*.description' => 'nullable|string',
//        ]);

//        echo "<pre>";
//        print_r($data);
//        echo "</pre>";
//        exit();

        try {
            //$ddtData = DdtData::from($validated);
            $ddt = $action->execute($data);

            return response()->json([
                'success' => true,
                'message' => 'DDT created successfully',
                'data' => DdtData::from($ddt),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display the specified DDT
     */
    public function show(int $id): JsonResponse
    {
        $query = new GetDdtByIdQuery($id);
        $ddt = $query->execute();

        $this->authorize('view', $ddt);

        return response()->json([
            'success' => true,
            'data' => DdtData::from($ddt),
        ]);
    }

    /**
     * Update the specified DDT (only Draft)
     */
    public function update(Request $request, Ddt $ddt, UpdateDdtAction $action): JsonResponse
    {
        $this->authorize('update', $ddt);

        $validated = $request->validate([
            'type' => 'sometimes|string',
            'ddt_number' => 'nullable|string|max:100',
            'ddt_date' => 'sometimes|date',
            'from_warehouse_id' => 'nullable|exists:warehouses,id',
            'to_warehouse_id' => 'nullable|exists:warehouses,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'customer_id' => 'nullable|exists:customers,id',
            'site_id' => 'nullable|exists:sites,id',
            'transport_type' => 'nullable|string',
            'carrier' => 'nullable|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
            'num_packages' => 'nullable|integer|min:1',
            'weight_kg' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.description' => 'nullable|string',
        ]);

        try {
            $ddtData = DdtData::from($validated);
            $updatedDdt = $action->execute($ddt, $ddtData);

            return response()->json([
                'success' => true,
                'message' => 'DDT updated successfully',
                'data' => DdtData::from($updatedDdt),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified DDT (only Draft)
     */
    public function destroy(Ddt $ddt, DeleteDdtAction $action): JsonResponse
    {
        $this->authorize('delete', $ddt);

        try {
            $action->execute($ddt);

            return response()->json([
                'success' => true,
                'message' => 'DDT deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Confirm DDT and generate stock movements (Draft → Issued)
     */
    public function confirm(Ddt $ddt, ConfirmDdtAction $action): JsonResponse
    {
        $this->authorize('update', $ddt);

        try {
            $confirmedDdt = $action->execute($ddt);

            return response()->json([
                'success' => true,
                'message' => 'DDT confirmed and stock movements generated successfully',
                'data' => DdtData::from($confirmedDdt),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Cancel DDT and reverse stock movements (Issued/InTransit → Cancelled)
     */
    public function cancel(Request $request, Ddt $ddt, CancelDdtAction $action): JsonResponse
    {
        $this->authorize('update', $ddt);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $cancelledDdt = $action->execute($ddt, $validated['reason']);

            return response()->json([
                'success' => true,
                'message' => 'DDT cancelled successfully',
                'data' => DdtData::from($cancelledDdt),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Mark DDT as delivered (Issued/InTransit → Delivered)
     */
    public function deliver(Ddt $ddt, DeliverDdtAction $action): JsonResponse
    {
        $this->authorize('update', $ddt);

        try {
            $deliveredDdt = $action->execute($ddt);

            return response()->json([
                'success' => true,
                'message' => 'DDT marked as delivered successfully',
                'data' => DdtData::from($deliveredDdt),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get active DDTs for a specific site
     */
    public function activeBySite(int $siteId): JsonResponse
    {
        $this->authorize('viewAny', Ddt::class);

        $query = new GetActiveDdtsBySiteQuery($siteId);
        $ddts = $query->execute();

        return response()->json([
            'success' => true,
            'data' => DdtData::collect($ddts, DataCollection::class),
        ]);
    }

    /**
     * Get pending rental returns
     */
    public function pendingRentalReturns(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Ddt::class);

        $query = new GetPendingRentalReturnsQuery($request->input('warehouse_id'));
        $ddts = $query->execute();

        return response()->json([
            'success' => true,
            'data' => DdtData::collect($ddts, DataCollection::class),
        ]);
    }

    /**
     * Get next DDT number suggestion
     */
    public function getNextNumber(): JsonResponse
    {
        $this->authorize('create', Ddt::class);

        $year = now()->year;
        $count = Ddt::whereYear('created_at', $year)->count() + 1;
        $nextNumber = 'DDT-'.$year.'-'.str_pad($count, 4, '0', STR_PAD_LEFT);

        return response()->json([
            'success' => true,
            'data' => [
                'suggested_number' => $nextNumber,
            ],
        ]);
    }
}
