<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Actions\Project\AssignWorkerToServiceAction;
use App\Actions\Project\CreateProjectServiceAction;
use App\Actions\Project\DeleteProjectServiceAction;
use App\Actions\Project\UpdateProjectServiceAction;
use App\Data\AssignWorkerToServiceData;
use App\Data\CreateProjectServiceData;
use App\Data\UpdateProjectServiceData;
use App\Domains\Project\Data\ProjectServiceData;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectService;
use App\Http\Controllers\Controller;
use App\Queries\Project\GetProjectServicesQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectServiceController extends Controller
{
    public function index(Project $project): JsonResponse
    {
        $this->authorize('viewAny', [ProjectService::class, $project]);

        $services = app(GetProjectServicesQuery::class, ['project' => $project])->execute();

        return response()->json([
            'success' => true,
            'data' => ProjectServiceData::collect($services),
        ]);
    }

    public function store(Project $project, Request $request): JsonResponse
    {
        $this->authorize('create', [ProjectService::class, $project]);

        $service = app(CreateProjectServiceAction::class)->execute(
            $project,
            CreateProjectServiceData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => ProjectServiceData::fromModel($service),
        ], 201);
    }

    public function show(ProjectService $projectService): JsonResponse
    {
        $this->authorize('view', $projectService);

        $projectService->load('workers.worker');

        return response()->json([
            'success' => true,
            'data' => ProjectServiceData::fromModel($projectService),
        ]);
    }

    public function update(ProjectService $projectService, Request $request): JsonResponse
    {
        $this->authorize('update', $projectService);

        $service = app(UpdateProjectServiceAction::class)->execute(
            $projectService,
            UpdateProjectServiceData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => ProjectServiceData::fromModel($service),
        ]);
    }

    public function destroy(ProjectService $projectService): JsonResponse
    {
        $this->authorize('delete', $projectService);

        app(DeleteProjectServiceAction::class)->execute($projectService);

        return response()->json(['success' => true]);
    }

    public function assignWorkers(ProjectService $projectService, Request $request): JsonResponse
    {
        $this->authorize('update', $projectService);

        $service = app(AssignWorkerToServiceAction::class)->execute(
            $projectService,
            AssignWorkerToServiceData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => ProjectServiceData::fromModel($service),
        ]);
    }
}
