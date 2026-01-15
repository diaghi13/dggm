<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SiteWorkerResource;
use App\Models\Site;
use App\Models\SiteWorker;
use App\Models\Worker;
use App\Services\WorkerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkerSiteController extends Controller
{
    public function __construct(
        private readonly WorkerService $workerService
    ) {}

    public function index(Worker $worker): AnonymousResourceCollection
    {
        $this->authorize('view', $worker);

        // Get SiteWorker assignments instead of just sites
        $siteWorkers = SiteWorker::where('worker_id', $worker->id)
            ->with(['site', 'worker.user', 'worker.supplier', 'assignedBy', 'roles'])
            ->orderBy('assigned_from', 'desc')
            ->get();

        return SiteWorkerResource::collection($siteWorkers);
    }

    public function store(Worker $worker, Request $request): JsonResponse
    {
        $this->authorize('update', $worker);

        $validated = $request->validate([
            'site_id' => ['required', 'exists:sites,id'],
            'site_role' => ['nullable', 'string', 'max:100'],
            'assigned_from' => ['required', 'date'],
            'assigned_to' => ['nullable', 'date', 'after:assigned_from'],
            'hourly_rate_override' => ['nullable', 'numeric', 'min:0'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $site = Site::findOrFail($validated['site_id']);
        $this->workerService->assignToSite($worker, $site->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Worker assigned to site successfully',
        ], 201);
    }

    public function destroy(Worker $worker, Site $site): JsonResponse
    {
        $this->authorize('update', $worker);

        $this->workerService->removeFromSite($worker, $site->id);

        return response()->json([
            'success' => true,
            'message' => 'Worker removed from site successfully',
        ]);
    }

    public function statistics(Worker $worker, Site $site): JsonResponse
    {
        $this->authorize('view', $worker);

        $totalHours = $worker->getTotalHoursOnSite($site->id);
        $totalCost = $worker->getTotalCostOnSite($site->id);

        return response()->json([
            'success' => true,
            'data' => [
                'total_hours' => $totalHours,
                'total_cost' => $totalCost,
            ],
        ]);
    }
}
