<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContractorRequest;
use App\Http\Requests\UpdateContractorRequest;
use App\Http\Resources\ContractorResource;
use App\Models\Contractor;
use App\Services\ContractorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractorController extends Controller
{
    public function __construct(
        private readonly ContractorService $contractorService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Contractor::class);

        $filters = $request->only(['search', 'contractor_type', 'is_active', 'specialization']);
        $perPage = $request->input('per_page', 20);

        $contractors = $this->contractorService->getAll($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => ContractorResource::collection($contractors),
            'meta' => [
                'current_page' => $contractors->currentPage(),
                'per_page' => $contractors->perPage(),
                'total' => $contractors->total(),
                'last_page' => $contractors->lastPage(),
            ],
        ]);
    }

    public function store(StoreContractorRequest $request): JsonResponse
    {
        $contractor = $this->contractorService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Contractor created successfully',
            'data' => new ContractorResource($contractor),
        ], 201);
    }

    public function show(Contractor $contractor): JsonResponse
    {
        $this->authorize('view', $contractor);

        $contractor = $this->contractorService->getById($contractor->id);

        return response()->json([
            'success' => true,
            'data' => new ContractorResource($contractor),
        ]);
    }

    public function update(UpdateContractorRequest $request, Contractor $contractor): JsonResponse
    {
        $contractor = $this->contractorService->update($contractor, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Contractor updated successfully',
            'data' => new ContractorResource($contractor),
        ]);
    }

    public function destroy(Contractor $contractor): JsonResponse
    {
        $this->authorize('delete', $contractor);

        try {
            $this->contractorService->delete($contractor);

            return response()->json([
                'success' => true,
                'message' => 'Contractor deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function statistics(Contractor $contractor): JsonResponse
    {
        $this->authorize('view', $contractor);

        $statistics = $this->contractorService->getStatistics($contractor);

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }

    public function pendingInvoices(Contractor $contractor): JsonResponse
    {
        $this->authorize('view', $contractor);

        $invoices = $this->contractorService->getPendingInvoices($contractor);

        return response()->json([
            'success' => true,
            'data' => $invoices,
        ]);
    }
}
