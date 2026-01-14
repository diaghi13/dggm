<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Services\SupplierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SupplierController extends Controller
{
    public function __construct(
        private readonly SupplierService $supplierService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Supplier::class);

        $filters = [
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
            'search' => $request->input('search'),
            'supplier_type' => $request->input('supplier_type'),
            'personnel_type' => $request->input('personnel_type'),
            'specialization' => $request->input('specialization'),
            'sort_by' => $request->get('sort_by', 'created_at'),
            'sort_order' => $request->get('sort_order', 'desc'),
        ];

        $suppliers = $this->supplierService->getAll(
            $filters,
            $request->get('per_page', 15)
        );

        return SupplierResource::collection($suppliers);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = $this->supplierService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Supplier created successfully',
            'data' => new SupplierResource($supplier),
        ], 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        $this->authorize('view', $supplier);

        return response()->json([
            'success' => true,
            'data' => new SupplierResource($supplier),
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $supplier = $this->supplierService->update($supplier, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Supplier updated successfully',
            'data' => new SupplierResource($supplier),
        ]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $this->authorize('delete', $supplier);

        $this->supplierService->delete($supplier);

        return response()->json([
            'success' => true,
            'message' => 'Supplier deleted successfully',
        ]);
    }

    public function getWorkers(Supplier $supplier): JsonResponse
    {
        $this->authorize('view', $supplier);

        $workers = $supplier->workers()->with(['rates', 'supplier'])->get();

        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\WorkerResource::collection($workers),
        ]);
    }

    public function getRates(Supplier $supplier): JsonResponse
    {
        $this->authorize('view', $supplier);

        $rates = $supplier->contractorRates()
            ->orderBy('valid_from', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rates,
        ]);
    }

    public function getStatistics(Supplier $supplier): JsonResponse
    {
        $this->authorize('view', $supplier);

        $statistics = [
            'active_workers_count' => $supplier->workers()->active()->count(),
            'total_workers_count' => $supplier->workers()->count(),
            'rates_count' => $supplier->contractorRates()->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }
}
