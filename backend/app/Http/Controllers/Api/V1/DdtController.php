<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDdtRequest;
use App\Http\Requests\UpdateDdtRequest;
use App\Http\Resources\DdtResource;
use App\Models\Ddt;
use App\Services\DdtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DdtController extends Controller
{
    public function __construct(
        private readonly DdtService $ddtService
    ) {}

    /**
     * Display a listing of DDTs
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Ddt::class);

        $filters = $request->only(['type', 'status', 'warehouse_id', 'site_id', 'search', 'sort_by', 'sort_order']);
        $perPage = $request->input('per_page', 20);

        $ddts = $this->ddtService->getAll($filters, $perPage);

        return DdtResource::collection($ddts);
    }

    /**
     * Store a newly created DDT
     */
    public function store(StoreDdtRequest $request): JsonResponse
    {
        $this->authorize('create', Ddt::class);

        $ddt = $this->ddtService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'DDT creato con successo.',
            'data' => new DdtResource($ddt),
        ], 201);
    }

    /**
     * Display the specified DDT
     */
    public function show(Ddt $ddt): JsonResponse
    {
        $this->authorize('view', $ddt);

        $ddt = $this->ddtService->getById($ddt->id);

        return response()->json([
            'success' => true,
            'data' => new DdtResource($ddt),
        ]);
    }

    /**
     * Update the specified DDT
     */
    public function update(UpdateDdtRequest $request, Ddt $ddt): JsonResponse
    {
        $this->authorize('update', $ddt);

        try {
            $ddt = $this->ddtService->update($ddt, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'DDT aggiornato con successo.',
                'data' => new DdtResource($ddt),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified DDT
     */
    public function destroy(Ddt $ddt): JsonResponse
    {
        $this->authorize('delete', $ddt);

        try {
            $this->ddtService->delete($ddt);

            return response()->json([
                'success' => true,
                'message' => 'DDT eliminato con successo.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Confirm DDT and generate stock movements
     */
    public function confirm(Ddt $ddt): JsonResponse
    {
        $this->authorize('update', $ddt);

        try {
            $ddt = $this->ddtService->confirmAndProcess($ddt);

            return response()->json([
                'success' => true,
                'message' => 'DDT confermato e movimenti generati con successo.',
                'data' => new DdtResource($ddt),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Cancel DDT and rollback stock movements
     */
    public function cancel(Ddt $ddt): JsonResponse
    {
        $this->authorize('update', $ddt);

        try {
            $ddt = $this->ddtService->cancel($ddt);

            return response()->json([
                'success' => true,
                'message' => 'DDT annullato con successo.',
                'data' => new DdtResource($ddt),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Mark DDT as delivered (confirm receipt)
     */
    public function markAsDelivered(Ddt $ddt): JsonResponse
    {
        $this->authorize('update', $ddt);

        try {
            $ddt = $this->ddtService->confirm($ddt->id);

            return response()->json([
                'success' => true,
                'message' => 'DDT marcato come consegnato.',
                'data' => new DdtResource($ddt),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
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
