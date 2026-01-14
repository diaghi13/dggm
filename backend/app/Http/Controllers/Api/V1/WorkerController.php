<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkerRequest;
use App\Http\Requests\UpdateWorkerRequest;
use App\Http\Resources\WorkerResource;
use App\Models\Worker;
use App\Services\WorkerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerController extends Controller
{
    public function __construct(
        private readonly WorkerService $workerService
    ) {}

    /**
     * Display a listing of workers
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Worker::class);

        $filters = $request->only([
            'search',
            'worker_type',
            'contract_type',
            'is_active',
            'supplier_id',
            'has_safety_training',
            'specialization',
            'site_id',
        ]);

        $perPage = $request->input('per_page', 20);

        $workers = $this->workerService->getAll($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => WorkerResource::collection($workers),
            'meta' => [
                'current_page' => $workers->currentPage(),
                'per_page' => $workers->perPage(),
                'total' => $workers->total(),
                'last_page' => $workers->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created worker
     */
    public function store(StoreWorkerRequest $request): JsonResponse
    {
        $worker = $this->workerService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Worker created successfully',
            'data' => new WorkerResource($worker),
        ], 201);
    }

    /**
     * Display the specified worker
     */
    public function show(Worker $worker): JsonResponse
    {
        $this->authorize('view', $worker);

        $worker = $this->workerService->getById($worker->id);

        return response()->json([
            'success' => true,
            'data' => new WorkerResource($worker),
        ]);
    }

    /**
     * Update the specified worker
     */
    public function update(UpdateWorkerRequest $request, Worker $worker): JsonResponse
    {
        $worker = $this->workerService->update($worker, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Worker updated successfully',
            'data' => new WorkerResource($worker),
        ]);
    }

    /**
     * Remove the specified worker
     */
    public function destroy(Worker $worker): JsonResponse
    {
        $this->authorize('delete', $worker);

        try {
            $this->workerService->delete($worker);

            return response()->json([
                'success' => true,
                'message' => 'Worker deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Deactivate worker
     */
    public function deactivate(Worker $worker, Request $request): JsonResponse
    {
        $this->authorize('update', $worker);

        $terminationDate = $request->input('termination_date')
            ? new \DateTime($request->input('termination_date'))
            : null;

        $worker = $this->workerService->deactivate($worker, $terminationDate);

        return response()->json([
            'success' => true,
            'message' => 'Worker deactivated successfully',
            'data' => new WorkerResource($worker),
        ]);
    }

    /**
     * Reactivate worker
     */
    public function reactivate(Worker $worker): JsonResponse
    {
        $this->authorize('update', $worker);

        $worker = $this->workerService->reactivate($worker);

        return response()->json([
            'success' => true,
            'message' => 'Worker reactivated successfully',
            'data' => new WorkerResource($worker),
        ]);
    }

    /**
     * Get worker statistics
     */
    public function statistics(Worker $worker): JsonResponse
    {
        $this->authorize('view', $worker);

        $statistics = $this->workerService->getStatistics($worker);

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }

    /**
     * Get available workers
     */
    public function available(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Worker::class);

        $filters = $request->only([
            'worker_type',
            'specialization',
            'has_safety_training',
        ]);

        $workers = $this->workerService->getAvailableWorkers($filters);

        return response()->json([
            'success' => true,
            'data' => WorkerResource::collection($workers),
        ]);
    }
}
