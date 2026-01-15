<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\SiteWorkerStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignWorkerToSiteRequest;
use App\Http\Requests\UpdateSiteWorkerRequest;
use App\Http\Resources\SiteWorkerResource;
use App\Models\Site;
use App\Models\SiteWorker;
use App\Models\Worker;
use App\Services\SiteWorkerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SiteWorkerController extends Controller
{
    public function __construct(
        private readonly SiteWorkerService $siteWorkerService
    ) {}

    /**
     * Get all workers assigned to a site
     */
    public function indexBySite(Request $request, Site $site): AnonymousResourceCollection
    {
        $this->authorize('viewAny', SiteWorker::class);

        $filters = $request->only(['status', 'is_active', 'from_date', 'to_date']);

        $workers = $this->siteWorkerService->getWorkersBySite($site->id, $filters);

        return SiteWorkerResource::collection($workers);
    }

    /**
     * Get all sites assigned to a worker
     */
    public function indexByWorker(Request $request, Worker $worker): AnonymousResourceCollection
    {
        $user = auth()->user();

        // Allow if user is Admin/PM with proper permissions OR if worker is viewing their own assignments
        $canViewAny = $user->can('site_workers.view') || $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
        $isOwnWorker = $user->worker && $user->worker->id === $worker->id;

        if (! $canViewAny && ! $isOwnWorker) {
            abort(403, 'Unauthorized to view these assignments');
        }

        $filters = $request->only(['status', 'is_active']);

        $sites = $this->siteWorkerService->getSitesByWorker($worker->id, $filters);

        return SiteWorkerResource::collection($sites);
    }

    /**
     * Assign a worker to a site
     */
    public function store(AssignWorkerToSiteRequest $request, Site $site): JsonResponse
    {
        $validated = $request->validated();

        $siteWorker = $this->siteWorkerService->assignWorker(
            $site->id,
            $validated['worker_id'],
            $validated,
            auth()->id()
        );

        return (new SiteWorkerResource($siteWorker))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Get a single site worker assignment
     */
    public function show(SiteWorker $siteWorker): SiteWorkerResource
    {
        $this->authorize('view', $siteWorker);

        $siteWorker->load(['worker.user', 'worker.supplier', 'site', 'assignedBy', 'roles']);

        return new SiteWorkerResource($siteWorker);
    }

    /**
     * Update a site worker assignment
     */
    public function update(UpdateSiteWorkerRequest $request, SiteWorker $siteWorker): SiteWorkerResource
    {
        $validated = $request->validated();

        $siteWorker = $this->siteWorkerService->updateAssignment($siteWorker->id, $validated);

        return new SiteWorkerResource($siteWorker);
    }

    /**
     * Worker accepts an assignment
     */
    public function accept(Request $request, SiteWorker $siteWorker): SiteWorkerResource
    {
        $this->authorize('respond', $siteWorker);

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $siteWorker = $this->siteWorkerService->acceptAssignment(
            $siteWorker->id,
            $validated['notes'] ?? null
        );

        return new SiteWorkerResource($siteWorker);
    }

    /**
     * Worker rejects an assignment
     */
    public function reject(Request $request, SiteWorker $siteWorker): SiteWorkerResource
    {
        $this->authorize('respond', $siteWorker);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $siteWorker = $this->siteWorkerService->rejectAssignment(
            $siteWorker->id,
            $validated['reason'] ?? null
        );

        return new SiteWorkerResource($siteWorker);
    }

    /**
     * Change assignment status (PM/Admin only)
     */
    public function changeStatus(Request $request, SiteWorker $siteWorker): SiteWorkerResource
    {
        $this->authorize('changeStatus', $siteWorker);

        $validated = $request->validate([
            'status' => 'required|in:pending,accepted,rejected,active,completed,cancelled',
        ]);

        $status = SiteWorkerStatus::from($validated['status']);

        $siteWorker = $this->siteWorkerService->changeStatus($siteWorker->id, $status);

        return new SiteWorkerResource($siteWorker);
    }

    /**
     * Cancel an assignment
     */
    public function cancel(Request $request, SiteWorker $siteWorker): SiteWorkerResource
    {
        $this->authorize('update', $siteWorker);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $siteWorker = $this->siteWorkerService->cancelAssignment(
            $siteWorker->id,
            $validated['reason'] ?? null
        );

        return new SiteWorkerResource($siteWorker);
    }

    /**
     * Complete an assignment
     */
    public function complete(SiteWorker $siteWorker): SiteWorkerResource
    {
        $this->authorize('update', $siteWorker);

        $siteWorker = $this->siteWorkerService->completeAssignment($siteWorker->id);

        return new SiteWorkerResource($siteWorker);
    }

    /**
     * Remove a worker from a site
     */
    public function destroy(SiteWorker $siteWorker): JsonResponse
    {
        $this->authorize('delete', $siteWorker);

        $this->siteWorkerService->removeWorker($siteWorker->id);

        return response()->json([
            'success' => true,
            'message' => 'Worker removed from site successfully',
        ]);
    }

    /**
     * Check for conflicts (worker assigned to other sites in same period)
     */
    public function checkConflicts(Request $request, SiteWorker $siteWorker): JsonResponse
    {
        $this->authorize('view', $siteWorker);

        $summary = $this->siteWorkerService->getConflictsSummary(
            $siteWorker->worker_id,
            $siteWorker->assigned_from,
            $siteWorker->assigned_to
        );

        return response()->json([
            'success' => true,
            'data' => [
                'has_conflicts' => $summary['has_conflicts'],
                'conflict_count' => $summary['conflict_count'],
                'conflicts' => SiteWorkerResource::collection($summary['conflicts']),
            ],
        ]);
    }

    /**
     * Get effective rate for a site worker
     */
    public function getEffectiveRate(SiteWorker $siteWorker): JsonResponse
    {
        $this->authorize('view', $siteWorker);

        $effectiveRate = $this->siteWorkerService->calculateEffectiveRate($siteWorker);

        return response()->json([
            'success' => true,
            'data' => [
                'effective_rate' => $effectiveRate,
                'hourly_rate_override' => $siteWorker->hourly_rate_override,
                'fixed_rate_override' => $siteWorker->fixed_rate_override,
                'rate_override_notes' => $siteWorker->rate_override_notes,
            ],
        ]);
    }
}
