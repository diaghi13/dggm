<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMaterialRequestRequest;
use App\Http\Requests\RespondToMaterialRequestRequest;
use App\Http\Requests\UpdateMaterialRequestRequest;
use App\Http\Resources\MaterialRequestResource;
use App\Models\MaterialRequest;
use App\Models\Site;
use App\Services\MaterialRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MaterialRequestController extends Controller
{
    public function __construct(
        protected MaterialRequestService $materialRequestService
    ) {}

    /**
     * Get all material requests for a site
     */
    public function indexBySite(Request $request, Site $site): AnonymousResourceCollection
    {
        $this->authorize('viewAny', [MaterialRequest::class, $site]);

        $filters = $request->only(['status', 'priority', 'worker_id']);
        $requests = $this->materialRequestService->getRequestsBySite($site->id, $filters);

        return MaterialRequestResource::collection($requests);
    }

    /**
     * Get all material requests by the authenticated worker
     */
    public function myRequests(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $worker = $user->worker;

        if (! $worker) {
            return MaterialRequestResource::collection([]);
        }

        $filters = $request->only(['status', 'site_id']);
        $requests = $this->materialRequestService->getRequestsByWorker($worker->id, $filters);

        return MaterialRequestResource::collection($requests);
    }

    /**
     * Get pending requests count for a site
     */
    public function pendingCount(Site $site): JsonResponse
    {
        $this->authorize('viewAny', [MaterialRequest::class, $site]);

        $count = $this->materialRequestService->getPendingCountBySite($site->id);

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $count,
            ],
        ]);
    }

    /**
     * Get statistics for a site
     */
    public function stats(Site $site): JsonResponse
    {
        $this->authorize('viewAny', [MaterialRequest::class, $site]);

        $stats = $this->materialRequestService->getStatsBySite($site->id);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Create a new material request
     */
    public function store(CreateMaterialRequestRequest $request): MaterialRequestResource
    {
        $user = $request->user();
        $worker = $user->worker;

        if (! $worker) {
            abort(403, 'Solo i lavoratori possono creare richieste materiale');
        }

        $this->authorize('create', MaterialRequest::class);

        $materialRequest = $this->materialRequestService->createRequest(
            $request->validated(),
            $worker->id,
            $user->id
        );

        return new MaterialRequestResource($materialRequest);
    }

    /**
     * Get a single material request
     */
    public function show(MaterialRequest $materialRequest): MaterialRequestResource
    {
        $this->authorize('view', $materialRequest);

        $materialRequest->load([
            'site',
            'material',
            'requestedByWorker.user',
            'requestedByUser',
            'respondedByUser',
            'approvedByUser',
            'deliveredByUser',
        ]);

        return new MaterialRequestResource($materialRequest);
    }

    /**
     * Update a material request (only if pending)
     */
    public function update(
        UpdateMaterialRequestRequest $request,
        MaterialRequest $materialRequest
    ): MaterialRequestResource {
        $this->authorize('update', $materialRequest);

        $user = $request->user();
        $materialRequest = $this->materialRequestService->updateRequest(
            $materialRequest->id,
            $request->validated(),
            $user->id
        );

        return new MaterialRequestResource($materialRequest);
    }

    /**
     * Approve a material request
     */
    public function approve(
        RespondToMaterialRequestRequest $request,
        MaterialRequest $materialRequest
    ): MaterialRequestResource {
        $this->authorize('approve', $materialRequest);

        $user = $request->user();
        $materialRequest = $this->materialRequestService->approveRequest(
            $materialRequest->id,
            $user->id,
            $request->input('quantity_approved'),
            $request->input('response_notes')
        );

        return new MaterialRequestResource($materialRequest);
    }

    /**
     * Reject a material request
     */
    public function reject(
        RespondToMaterialRequestRequest $request,
        MaterialRequest $materialRequest
    ): MaterialRequestResource {
        $this->authorize('reject', $materialRequest);

        $user = $request->user();
        $materialRequest = $this->materialRequestService->rejectRequest(
            $materialRequest->id,
            $user->id,
            $request->input('rejection_reason')
        );

        return new MaterialRequestResource($materialRequest);
    }

    /**
     * Mark as delivered
     */
    public function markDelivered(
        Request $request,
        MaterialRequest $materialRequest
    ): MaterialRequestResource {
        $this->authorize('deliver', $materialRequest);

        $request->validate([
            'quantity_delivered' => ['nullable', 'numeric', 'min:0.01'],
        ]);

        $user = $request->user();
        $materialRequest = $this->materialRequestService->markAsDelivered(
            $materialRequest->id,
            $user->id,
            $request->input('quantity_delivered')
        );

        return new MaterialRequestResource($materialRequest);
    }

    /**
     * Delete a material request
     */
    public function destroy(Request $request, MaterialRequest $materialRequest): JsonResponse
    {
        $this->authorize('delete', $materialRequest);

        $user = $request->user();
        $this->materialRequestService->deleteRequest($materialRequest->id, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Richiesta eliminata con successo',
        ]);
    }
}
