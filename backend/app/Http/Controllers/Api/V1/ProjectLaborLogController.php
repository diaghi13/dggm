<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Project\ApproveLaborLogAction;
use App\Actions\Project\LogLaborHoursAction;
use App\Actions\Project\RejectLaborLogAction;
use App\Data\ProjectLaborLogData;
use App\Enums\ProjectLogStatus;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectLaborLog;
use App\Models\ProjectWorker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectLaborLogController extends Controller
{
    /**
     * List labor logs for a project (optionally filter by project_worker_id).
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $query = ProjectLaborLog::query()
            ->where('project_id', $project->id)
            ->with(['worker', 'projectWorker', 'submittedBy', 'approvedBy'])
            ->when($request->project_worker_id, fn ($q, $id) => $q->where('project_worker_id', $id)
            )
            ->when($request->status, fn ($q, $status) => $q->where('status', $status)
            )
            ->orderByDesc('log_date');

        $logs = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => ProjectLaborLogData::collect($logs->items()),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Worker submits a labor log.
     */
    public function store(Request $request, ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('view', $projectWorker);

        $validated = $request->validate([
            'log_date' => ['required', 'date'],
            'regular_hours' => ['required', 'numeric', 'min:0', 'max:24'],
            'overtime_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'description' => ['nullable', 'string', 'max:1000'],
            'schedule_day_id' => ['nullable', 'integer', 'exists:project_worker_schedules,id'],
        ]);

        $log = app(LogLaborHoursAction::class)->execute(
            $projectWorker,
            $validated,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'data' => ProjectLaborLogData::fromModel($log),
        ], 201);
    }

    /**
     * Show a single labor log.
     */
    public function show(ProjectLaborLog $projectLaborLog): JsonResponse
    {
        $this->authorize('view', $projectLaborLog->project);

        $projectLaborLog->load(['worker', 'projectWorker', 'submittedBy', 'approvedBy', 'laborCost']);

        return response()->json([
            'success' => true,
            'data' => ProjectLaborLogData::fromModel($projectLaborLog),
        ]);
    }

    /**
     * PM approves a submitted labor log.
     */
    public function approve(ProjectLaborLog $projectLaborLog): JsonResponse
    {
        $this->authorize('update', $projectLaborLog->project);

        abort_if($projectLaborLog->status !== ProjectLogStatus::Submitted, 422, 'Log must be in submitted status to approve.');

        $log = app(ApproveLaborLogAction::class)->execute($projectLaborLog, auth()->id());

        return response()->json([
            'success' => true,
            'data' => ProjectLaborLogData::fromModel($log),
        ]);
    }

    /**
     * PM rejects a submitted labor log.
     */
    public function reject(Request $request, ProjectLaborLog $projectLaborLog): JsonResponse
    {
        $this->authorize('update', $projectLaborLog->project);

        abort_if($projectLaborLog->status !== ProjectLogStatus::Submitted, 422, 'Log must be in submitted status to reject.');

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $log = app(RejectLaborLogAction::class)->execute(
            $projectLaborLog,
            auth()->id(),
            $validated['rejection_reason']
        );

        return response()->json([
            'success' => true,
            'data' => ProjectLaborLogData::fromModel($log),
        ]);
    }
}
