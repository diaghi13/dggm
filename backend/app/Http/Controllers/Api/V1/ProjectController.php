<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Project\CreateProjectAction;
use App\Actions\Project\DeleteProjectAction;
use App\Actions\Project\UpdateProjectAction;
use App\Data\ProjectData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use App\Queries\Project\GetProjectsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\PaginatedDataCollection;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Project::class);

        $filters = [
            'status' => $request->input('status'),
            'customer_id' => $request->input('customer_id'),
            'project_manager_id' => $request->input('project_manager_id'),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
            'search' => $request->input('search'),
            'sort_by' => $request->get('sort_by', 'created_at'),
            'sort_order' => $request->get('sort_order', 'desc'),
        ];

        $projects = app(GetProjectsQuery::class)->execute(
            $filters,
            $request->get('per_page', 15)
        );

        return response()->json([
            'success' => true,
            ...ProjectData::collect($projects->items(), PaginatedDataCollection::class)->toArray(),
        ]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = app(CreateProjectAction::class)->execute(
            ProjectData::from($request->validated())
        );

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => ProjectData::from($project->load(['customer', 'projectManager'])),
        ], 201);
    }

    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $project->load(['customer', 'projectManager', 'quote', 'media']);

        return response()->json([
            'success' => true,
            'data' => ProjectData::from($project),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $project = app(UpdateProjectAction::class)->execute(
            $project,
            ProjectData::from($request->validated())
        );

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => ProjectData::from($project),
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        app(DeleteProjectAction::class)->execute($project);

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully',
        ]);
    }
}
