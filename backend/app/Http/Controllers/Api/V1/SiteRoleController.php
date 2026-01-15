<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSiteRoleRequest;
use App\Http\Requests\UpdateSiteRoleRequest;
use App\Http\Resources\SiteRoleResource;
use App\Models\SiteRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SiteRoleController extends Controller
{
    /**
     * Display a listing of site roles.
     */
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', SiteRole::class);

        $roles = SiteRole::query()
            ->ordered()
            ->get();

        return SiteRoleResource::collection($roles);
    }

    /**
     * Store a newly created site role.
     */
    public function store(StoreSiteRoleRequest $request): JsonResponse
    {
        $this->authorize('create', SiteRole::class);

        $siteRole = SiteRole::create([
            'name' => $request->input('name'),
            'slug' => $request->input('slug'),
            'description' => $request->input('description'),
            'color' => $request->input('color', '#3B82F6'),
            'sort_order' => $request->input('sort_order', 0),
            'is_active' => $request->input('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ruolo cantiere creato con successo',
            'data' => new SiteRoleResource($siteRole),
        ], 201);
    }

    /**
     * Display the specified site role.
     */
    public function show(SiteRole $siteRole): JsonResponse
    {
        $this->authorize('view', $siteRole);

        return response()->json([
            'success' => true,
            'data' => new SiteRoleResource($siteRole),
        ]);
    }

    /**
     * Update the specified site role.
     */
    public function update(UpdateSiteRoleRequest $request, SiteRole $siteRole): JsonResponse
    {
        $this->authorize('update', $siteRole);

        $siteRole->update($request->only([
            'name',
            'description',
            'color',
            'sort_order',
            'is_active',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Ruolo cantiere aggiornato con successo',
            'data' => new SiteRoleResource($siteRole),
        ]);
    }

    /**
     * Remove the specified site role.
     */
    public function destroy(SiteRole $siteRole): JsonResponse
    {
        $this->authorize('delete', $siteRole);

        // Check if role is in use
        if ($siteRole->siteWorkers()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossibile eliminare il ruolo perché è assegnato a dei lavoratori',
            ], 422);
        }

        $siteRole->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ruolo cantiere eliminato con successo',
        ]);
    }
}
