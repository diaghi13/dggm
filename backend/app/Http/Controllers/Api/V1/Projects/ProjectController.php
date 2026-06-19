<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Actions\Project\CreateProjectAction;
use App\Actions\Project\DeleteProjectAction;
use App\Actions\Project\UpdateProjectAction;
use App\Domains\Project\Data\ProjectData;
use App\Domains\Project\Data\ProjectStockData;
use App\Domains\Project\Data\ProjectStockSummaryData;
use App\Domains\Project\Models\Project;
use App\Events\OrderListGenerated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Queries\Project\GetProjectOrderListQuery;
use App\Queries\Project\GetProjectsQuery;
use App\Queries\Project\GetProjectStockQuery;
use App\Queries\Project\GetProjectStockSummaryQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            'data' => array_map(fn (Project $p) => ProjectData::fromModel($p), $projects->items()),
            'meta' => [
                'current_page' => $projects->currentPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total(),
                'last_page' => $projects->lastPage(),
            ],
        ]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = app(CreateProjectAction::class)->execute(
            ProjectData::from($request->validated())
        );

        $project->load(['customer', 'projectManager']);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => ProjectData::fromModel($project),
        ], 201);
    }

    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $project->load(['customer', 'projectManager', 'quote', 'media']);

        return response()->json([
            'success' => true,
            'data' => ProjectData::fromModel($project),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $project = app(UpdateProjectAction::class)->execute(
            $project,
            ProjectData::from(array_merge(
                ProjectData::fromModel($project)->except('customer')->toArray(),
                $request->validated()
            ))
        );

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => ProjectData::fromModel($project),
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

    /**
     * Compute the Final Balance report for a project.
     */
    public function finalBalance(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $balance = app(\App\Services\FinalBalanceService::class)->compute($project);

        return response()->json([
            'success' => true,
            'data' => $balance,
        ]);
    }

    /**
     * List non-consumable materials currently on site (project stock).
     */
    public function projectStock(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $items = app(GetProjectStockQuery::class, ['project' => $project])->execute();

        return response()->json([
            'success' => true,
            'data' => ProjectStockData::collect($items->map(fn ($item) => ProjectStockData::fromModel($item))->all()),
        ]);
    }

    /**
     * Return aggregate stock summary for a project.
     */
    public function stockSummary(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $summary = app(GetProjectStockSummaryQuery::class, ['project' => $project])->execute();

        return response()->json([
            'success' => true,
            'data' => ProjectStockSummaryData::from($summary),
        ]);
    }

    /**
     * Generate the order list for a project (Step 3).
     * Classifies all project materials into: available, to_purchase, to_subrental.
     */
    public function orderList(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $list = app(GetProjectOrderListQuery::class, ['project' => $project])->execute();

        OrderListGenerated::dispatch($project, [
            'available_count' => count($list['available']),
            'to_purchase_count' => count($list['to_purchase']),
            'to_subrental_count' => count($list['to_subrental']),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'generated_at' => now()->toIso8601String(),
                'project_id' => $project->id,
                'available' => $list['available'],
                'to_purchase' => $list['to_purchase'],
                'to_subrental' => $list['to_subrental'],
                'totals' => [
                    'available_estimated_cost' => collect($list['available'])->sum('estimated_cost'),
                    'to_purchase_estimated_cost' => collect($list['to_purchase'])->sum('estimated_cost'),
                    'to_subrental_estimated_cost' => collect($list['to_subrental'])->sum('estimated_cost'),
                ],
            ],
        ]);
    }

    /**
     * Get all worker schedules for a project (for "Convocazioni" view).
     * GET /projects/{project}/schedules
     */
    public function workerSchedules(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $schedules = \App\Domains\Project\Models\ProjectWorkerSchedule::query()
            ->where('project_worker_schedules.project_id', $project->id)
            ->with(['worker'])
            ->leftJoinSub(
                \App\Domains\Project\Models\ProjectWorker::query()
                    ->select('project_id', 'worker_id', \Illuminate\Support\Facades\DB::raw('GROUP_CONCAT(DISTINCT role_name ORDER BY id SEPARATOR ", ") as aggregated_role_name'))
                    ->where('project_id', $project->id)
                    ->whereNotNull('worker_id')
                    ->groupBy('project_id', 'worker_id'),
                'pw_roles',
                fn ($join) => $join
                    ->on('pw_roles.project_id', '=', 'project_worker_schedules.project_id')
                    ->on('pw_roles.worker_id', '=', 'project_worker_schedules.worker_id')
            )
            ->select('project_worker_schedules.*', 'pw_roles.aggregated_role_name')
            ->orderBy('project_worker_schedules.scheduled_date')
            ->orderBy('project_worker_schedules.planned_start_time')
            ->get();

        $data = $schedules->map(fn (\App\Domains\Project\Models\ProjectWorkerSchedule $s) => [
            'id' => $s->id,
            'worker_id' => $s->worker_id,
            'worker_name' => $s->worker?->full_name,
            'role_name' => $s->aggregated_role_name,
            'scheduled_date' => $s->scheduled_date->format('Y-m-d'),
            'planned_start_time' => $s->planned_start_time,
            'planned_end_time' => $s->planned_end_time,
            'planned_hours' => $s->planned_hours,
            'effective_planned_hours' => $s->effective_planned_hours,
            'status' => $s->status,
            'notes' => $s->notes,
        ]);

        return response()->json(['success' => true, 'data' => $data]);
    }
}
