<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Domains\Project\Data\ProjectRoleData;
use App\Domains\Project\Models\ProjectRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectRoleController extends Controller
{
    /**
     * Display a listing of project roles.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', ProjectRole::class);

        $roles = ProjectRole::query()
            ->ordered()
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProjectRoleData::collect($roles),
        ]);
    }

    /**
     * Store a newly created project role.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', ProjectRole::class);

        $data = ProjectRoleData::from($request);

        $projectRole = ProjectRole::create([
            'name' => $data->name,
            'slug' => $data->slug,
            'description' => $data->description,
            'color' => $data->color ?? '#3B82F6',
            'sort_order' => $data->sort_order ?? 0,
            'is_active' => $data->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ruolo progetto creato con successo',
            'data' => ProjectRoleData::from($projectRole),
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
            'data' => ProjectRoleData::from($projectRole),
        ]);
    }

    /**
     * Update the specified project role.
     */
    public function update(Request $request, ProjectRole $projectRole): JsonResponse
    {
        $this->authorize('update', $projectRole);

        $data = ProjectRoleData::from($request);

        $projectRole->update([
            'name' => $data->name,
            'description' => $data->description,
            'color' => $data->color,
            'sort_order' => $data->sort_order,
            'is_active' => $data->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ruolo progetto aggiornato con successo',
            'data' => ProjectRoleData::from($projectRole),
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
