<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Actions\Project\AcceptWorkerAssignmentAction;
use App\Actions\Project\AssignWorkerToProjectAction;
use App\Actions\Project\ChangeWorkerStatusAction;
use App\Actions\Project\RejectWorkerAssignmentAction;
use App\Actions\Project\ResendWorkerInviteAction;
use App\Actions\Project\UpdateWorkerAssignmentAction;
use App\Domains\Project\Data\ProjectWorkerData;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectWorker;
use App\Enums\ProjectWorkerStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignWorkerToProjectRequest;
use App\Http\Requests\UpdateProjectWorkerRequest;
use App\Models\Worker;
use App\Queries\Project\GetProjectWorkersQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectWorkerController extends Controller
{
    /**
     * Get all workers assigned to a project
     */
    public function indexByProject(Request $request, Project $project): JsonResponse
    {
        $this->authorize('viewAny', ProjectWorker::class);

        $workers = GetProjectWorkersQuery::execute(
            $project->id,
            $request->only(['status', 'is_active'])
        );

        return response()->json([
            'success' => true,
            'data' => $workers->map(fn (ProjectWorker $pw) => ProjectWorkerData::fromModel($pw))->values(),
        ]);
    }

    /**
     * Create an empty labor slot manually (without a worker).
     * POST /projects/{project}/workers/slot
     */
    public function storeSlot(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'role_name' => 'required|string|max:255',
            'estimated_days' => 'nullable|numeric|min:0',
            'budget_cost_rate' => 'nullable|numeric|min:0',
            'customer_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $slotIndex = ProjectWorker::where('project_id', $project->id)
            ->where('status', ProjectWorkerStatus::Slot)
            ->count() + 1;

        $slot = ProjectWorker::create([
            'project_id' => $project->id,
            'worker_id' => null,
            'status' => ProjectWorkerStatus::Slot,
            'assigned_by_user_id' => auth()->id(),
            'role_name' => $validated['role_name'],
            'slot_index' => $slotIndex,
            'estimated_days' => $validated['estimated_days'] ?? null,
            'budget_cost_rate' => $validated['budget_cost_rate'] ?? null,
            'customer_rate' => $validated['customer_rate'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
            'is_external' => false,
            'is_scheduled' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::fromModel($slot),
        ], 201);
    }

    /**
     * Get all projects assigned to a worker
     */
    public function indexByWorker(Request $request, Worker $worker): JsonResponse
    {
        $user = auth()->user();

        $canViewAny = $user->can('project_workers.view') || $user->hasRole(['SuperAdmin', 'Admin', 'ProjectManager']);
        $isOwnWorker = $user->worker && $user->worker->id === $worker->id;

        if (! $canViewAny && ! $isOwnWorker) {
            abort(403, 'Unauthorized to view these assignments');
        }

        $query = ProjectWorker::query()
            ->where('worker_id', $worker->id)
            ->with(['project.customer', 'assignedBy', 'roles']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $assignments = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::collect($assignments),
        ]);
    }

    /**
     * Assign a worker to a project
     */
    public function store(AssignWorkerToProjectRequest $request, Project $project): JsonResponse
    {
        $validated = $request->validated();
        $worker = Worker::findOrFail($validated['worker_id']);

        $projectWorker = app(AssignWorkerToProjectAction::class)->execute(
            $project,
            $worker,
            collect($validated)->except('worker_id')->toArray(),
            auth()->id()
        );

        $projectWorker->load(['worker.user', 'project', 'assignedBy', 'roles']);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::fromModel($projectWorker),
        ], 201);
    }

    /**
     * Assign a worker to an existing project worker slot.
     * The slot must have status='slot' and worker_id=null.
     */
    public function assignSlot(Request $request, ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('update', $projectWorker);

        abort_if(
            $projectWorker->status !== ProjectWorkerStatus::Slot,
            422,
            'This assignment is not an unassigned slot.'
        );

        $validated = $request->validate([
            'worker_id' => ['required', 'integer', 'exists:workers,id'],
            'assigned_from' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'date', 'after_or_equal:assigned_from'],
            'notes' => ['nullable', 'string'],
            'actual_cost_rate' => ['nullable', 'numeric', 'min:0'],
        ]);

        $worker = Worker::findOrFail($validated['worker_id']);

        $actualCostRate = $request->input('actual_cost_rate') !== null
            ? (float) $request->input('actual_cost_rate')
            : null;

        $slot = app(\App\Actions\Project\AssignWorkerToSlotAction::class)->execute(
            $projectWorker,
            $worker,
            $validated,
            $actualCostRate,
        );

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::fromModel($slot),
        ]);
    }

    /**
     * Get a single project worker assignment
     */
    public function show(ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('view', $projectWorker);

        $projectWorker->load(['worker.user', 'worker.supplier', 'project', 'assignedBy', 'roles']);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::from($projectWorker),
        ]);
    }

    /**
     * Update a project worker assignment
     */
    public function update(UpdateProjectWorkerRequest $request, ProjectWorker $projectWorker): JsonResponse
    {
        $projectWorker = app(UpdateWorkerAssignmentAction::class)->execute(
            $projectWorker,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::from($projectWorker),
        ]);
    }

    /**
     * Worker accepts an assignment
     */
    public function accept(Request $request, ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('respond', $projectWorker);

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $projectWorker = app(AcceptWorkerAssignmentAction::class)->execute(
            $projectWorker,
            $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::from($projectWorker),
        ]);
    }

    /**
     * Worker rejects an assignment
     */
    public function reject(Request $request, ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('respond', $projectWorker);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $projectWorker = app(RejectWorkerAssignmentAction::class)->execute(
            $projectWorker,
            $validated['reason'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::from($projectWorker),
        ]);
    }

    /**
     * Change assignment status (PM/Admin only)
     */
    public function changeStatus(Request $request, ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('changeStatus', $projectWorker);

        $validated = $request->validate([
            'status' => 'required|in:pending,accepted,rejected,active,completed,cancelled',
        ]);

        $status = ProjectWorkerStatus::from($validated['status']);

        $projectWorker = app(ChangeWorkerStatusAction::class)->execute($projectWorker, $status);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::from($projectWorker),
        ]);
    }

    /**
     * Cancel an assignment
     */
    public function cancel(Request $request, ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('update', $projectWorker);

        $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $projectWorker = app(ChangeWorkerStatusAction::class)->execute(
            $projectWorker,
            ProjectWorkerStatus::Cancelled
        );

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::from($projectWorker),
        ]);
    }

    /**
     * Complete an assignment
     */
    public function complete(ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('update', $projectWorker);

        $projectWorker = app(ChangeWorkerStatusAction::class)->execute(
            $projectWorker,
            ProjectWorkerStatus::Completed
        );

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerData::from($projectWorker),
        ]);
    }

    /**
     * Re-send assignment invite notification to a worker in pending status.
     */
    public function resendInvite(ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('update', $projectWorker);

        abort_if(
            $projectWorker->status->value !== 'pending',
            422,
            'Cannot resend invite: worker is not in pending status.'
        );

        app(ResendWorkerInviteAction::class)->execute($projectWorker);

        return response()->json([
            'success' => true,
            'message' => 'Invitation resent successfully.',
        ]);
    }

    /**
     * Remove a worker from a project
     */
    public function destroy(ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('delete', $projectWorker);

        $projectWorker->delete();

        return response()->json([
            'success' => true,
            'message' => 'Worker removed from project successfully',
        ]);
    }

    /**
     * Check for conflicts (worker assigned to other projects in same period)
     */
    public function checkConflicts(ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('view', $projectWorker);

        $conflicts = ProjectWorker::query()
            ->where('worker_id', $projectWorker->worker_id)
            ->where('id', '!=', $projectWorker->id)
            ->whereIn('status', [ProjectWorkerStatus::Pending, ProjectWorkerStatus::Accepted, ProjectWorkerStatus::Active])
            ->where(function ($q) use ($projectWorker) {
                $q->whereBetween('assigned_from', [$projectWorker->assigned_from, $projectWorker->assigned_to ?? now()->addYears(10)])
                    ->orWhereBetween('assigned_to', [$projectWorker->assigned_from, $projectWorker->assigned_to ?? now()->addYears(10)])
                    ->orWhere(function ($inner) use ($projectWorker) {
                        $inner->where('assigned_from', '<=', $projectWorker->assigned_from)
                            ->where(function ($q2) use ($projectWorker) {
                                $q2->whereNull('assigned_to')
                                    ->orWhere('assigned_to', '>=', $projectWorker->assigned_to ?? now());
                            });
                    });
            })
            ->with(['project', 'worker.user'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'has_conflicts' => $conflicts->isNotEmpty(),
                'conflict_count' => $conflicts->count(),
                'conflicts' => ProjectWorkerData::collect($conflicts),
            ],
        ]);
    }

    /**
     * Get effective rate for a project worker
     */
    public function getEffectiveRate(ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('view', $projectWorker);

        $effectiveRate = $projectWorker->hourly_rate_override
            ?? $projectWorker->worker->default_hourly_rate
            ?? null;

        return response()->json([
            'success' => true,
            'data' => [
                'effective_rate' => $effectiveRate,
                'hourly_rate_override' => $projectWorker->hourly_rate_override,
                'fixed_rate_override' => $projectWorker->fixed_rate_override,
                'rate_override_notes' => $projectWorker->rate_override_notes,
            ],
        ]);
    }
}
