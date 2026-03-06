<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRoleRequest;
use App\Http\Requests\UpdateProjectRoleRequest;
use App\Http\Resources\ProjectRoleResource;
use App\Models\ProjectRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectRoleController extends Controller
{
    /**
     * Display a listing of project roles.
     */
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', ProjectRole::class);

        $roles = ProjectRole::query()
            ->ordered()
            ->get();

        return ProjectRoleResource::collection($roles);
    }

    /**
     * Store a newly created project role.
     */
    public function store(StoreProjectRoleRequest $request): JsonResponse
    {
        $this->authorize('create', ProjectRole::class);

        $projectRole = ProjectRole::create([
            'name' => $request->input('name'),
            'slug' => $request->input('slug'),
            'description' => $request->input('description'),
            'color' => $request->input('color', '#3B82F6'),
            'sort_order' => $request->input('sort_order', 0),
            'is_active' => $request->input('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ruolo progetto creato con successo',
            'data' => new ProjectRoleResource($projectRole),
        ], 201);
    }

    /**
     * Display the specified project role.
     */
    public function show(ProjectRole $projectRole): JsonResponse
    {
        $this->authorize('view', $projectRole);

        return response()->json([
            'success' => true,
            'data' => new ProjectRoleResource($projectRole),
        ]);
    }

    /**
     * Update the specified project role.
     */
    public function update(UpdateProjectRoleRequest $request, ProjectRole $projectRole): JsonResponse
    {
        $this->authorize('update', $projectRole);

        $projectRole->update($request->only([
            'name',
            'description',
            'color',
            'sort_order',
            'is_active',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Ruolo progetto aggiornato con successo',
            'data' => new ProjectRoleResource($projectRole),
        ]);
    }

    /**
     * Remove the specified project role.
     */
    public function destroy(ProjectRole $projectRole): JsonResponse
    {
        $this->authorize('delete', $projectRole);

        if ($projectRole->projectWorkers()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossibile eliminare il ruolo perché è assegnato a dei lavoratori',
            ], 422);
        }

        $projectRole->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ruolo progetto eliminato con successo',
        ]);
    }
}
