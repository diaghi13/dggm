<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSiteRequest;
use App\Http\Requests\UpdateSiteRequest;
use App\Http\Resources\SiteResource;
use App\Models\Site;
use App\Services\SiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SiteController extends Controller
{
    public function __construct(
        private readonly SiteService $siteService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Site::class);

        $filters = [
            'status' => $request->input('status'),
            'customer_id' => $request->input('customer_id'),
            'project_manager_id' => $request->input('project_manager_id'),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
            'search' => $request->input('search'),
            'sort_by' => $request->get('sort_by', 'created_at'),
            'sort_order' => $request->get('sort_order', 'desc'),
        ];

        $sites = $this->siteService->getAll(
            $filters,
            $request->get('per_page', 15)
        );

        return SiteResource::collection($sites);
    }

    public function store(StoreSiteRequest $request): JsonResponse
    {
        $site = $this->siteService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Site created successfully',
            'data' => new SiteResource($site->load(['customer', 'projectManager'])),
        ], 201);
    }

    public function show(Site $site): JsonResponse
    {
        $this->authorize('view', $site);

        $site->load(['customer', 'projectManager', 'quote', 'media']);

        return response()->json([
            'success' => true,
            'data' => new SiteResource($site),
        ]);
    }

    public function update(UpdateSiteRequest $request, Site $site): JsonResponse
    {
        $site = $this->siteService->update($site, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Site updated successfully',
            'data' => new SiteResource($site),
        ]);
    }

    public function destroy(Site $site): JsonResponse
    {
        $this->authorize('delete', $site);

        $this->siteService->delete($site);

        return response()->json([
            'success' => true,
            'message' => 'Site deleted successfully',
        ]);
    }
}
