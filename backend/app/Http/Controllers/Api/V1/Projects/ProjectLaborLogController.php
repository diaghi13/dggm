<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Actions\Project\ApproveLaborLogAction;
use App\Actions\Project\LogLaborHoursAction;
use App\Actions\Project\RejectLaborLogAction;
use App\Domains\Project\Data\ProjectLaborLogData;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLaborLog;
use App\Domains\Project\Models\ProjectWorker;
use App\Domains\Project\Models\ProjectWorkerSchedule;
use App\Enums\ProjectLogStatus;
use App\Enums\RateContext;
use App\Enums\RateType;
use App\Http\Controllers\Controller;
use App\Models\WorkerRate;
use App\Queries\Project\GetOvertimeSummaryQuery;
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
            'data' => collect($logs->items())->map(fn ($log) => ProjectLaborLogData::fromModel($log)),
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
            'clock_in' => ['nullable', 'date_format:H:i'],
            'clock_out' => ['nullable', 'date_format:H:i'],
            'break_minutes' => ['nullable', 'integer', 'min:0', 'max:480'],
            'regular_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'overtime_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'overtime_rate_type' => ['nullable', 'in:multiplier,direct_rate'],
            'overtime_direct_rate' => ['nullable', 'numeric', 'min:0'],
            'overtime_cause' => ['nullable', 'string', 'in:client_request,project_delay_our_fault,project_delay_client_fault,weather,unforeseen'],
            'overtime_rate_multiplier' => ['nullable', 'numeric', 'min:0'],
            'is_billable_to_client' => ['nullable', 'boolean'],
            'include_in_final_balance' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
            'schedule_day_id' => ['nullable', 'integer', 'exists:project_worker_schedules,id'],
        ]);

        // Guard: only one log per project_worker per day
        $existingLog = ProjectLaborLog::where('project_worker_id', $projectWorker->id)
            ->where('log_date', $validated['log_date'])
            ->first();

        if ($existingLog) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Esiste già una registrazione ore per questo lavoratore in questa data.',
                    'existing_log_id' => $existingLog->id,
                ],
            ], 422);
        }

        // Auto-compute hours from clock_in/clock_out if provided
        if (! empty($validated['clock_in']) && ! empty($validated['clock_out'])) {
            $start = \Carbon\Carbon::parse($validated['clock_in']);
            $end = \Carbon\Carbon::parse($validated['clock_out']);
            if ($end->lt($start)) {
                $end->addDay();
            }
            $breakMinutes = (int) ($validated['break_minutes'] ?? 0);
            $totalMinutes = max(0, $start->diffInMinutes($end) - $breakMinutes);
            $totalHours = round($totalMinutes / 60, 2);

            // Split into regular/overtime using worker's rate tiers
            [$regularHours, $overtimeHours] = $this->splitHoursByTiers($projectWorker, $totalHours);

            $validated['regular_hours'] = $regularHours;
            $validated['overtime_hours'] = $overtimeHours;
        }

        $validated['regular_hours'] = $validated['regular_hours'] ?? 0;

        // ── Auto-approval logic ────────────────────────────────────────────────
        $overtimeHours = $validated['overtime_hours'] ?? 0;
        $hasOvertime = (float) $overtimeHours > 0;

        $hasSchedule = ProjectWorkerSchedule::where('project_id', $projectWorker->project_id)
            ->where('worker_id', $projectWorker->worker_id)
            ->where('scheduled_date', $validated['log_date'])
            ->whereIn('status', [
                \App\Enums\ProjectScheduleDayStatus::Accepted->value,
                \App\Enums\ProjectScheduleDayStatus::Pending->value,
            ])
            ->exists();

        if ($hasSchedule && ! $hasOvertime) {
            // Worker was scheduled, no overtime → auto-approve (no PM review needed)
            $validated['status'] = ProjectLogStatus::Approved;
            $validated['approved_at'] = now()->toDateTimeString();
            $validated['is_auto_approved'] = true;
        } else {
            $validated['status'] = ProjectLogStatus::Submitted;
            $validated['is_auto_approved'] = false;
        }
        // ──────────────────────────────────────────────────────────────────────

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
     * Return overtime hours grouped by cause and billability.
     */
    public function overtimeSummary(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $summary = app(GetOvertimeSummaryQuery::class, ['project' => $project])->execute();

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Update a labor log (only when draft or submitted).
     */
    public function update(Request $request, ProjectLaborLog $projectLaborLog): JsonResponse
    {
        $this->authorize('update', $projectLaborLog->project);

        abort_if(
            ! in_array($projectLaborLog->status, [ProjectLogStatus::Draft, ProjectLogStatus::Submitted]),
            422,
            'Solo i log in bozza o inviati possono essere modificati.'
        );

        $validated = $request->validate([
            'log_date' => ['required', 'date'],
            'clock_in' => ['nullable', 'date_format:H:i'],
            'clock_out' => ['nullable', 'date_format:H:i'],
            'break_minutes' => ['nullable', 'integer', 'min:0', 'max:480'],
            'regular_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'overtime_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'overtime_rate_type' => ['nullable', 'in:multiplier,direct_rate'],
            'overtime_direct_rate' => ['nullable', 'numeric', 'min:0'],
            'overtime_cause' => ['nullable', 'string', 'in:client_request,project_delay_our_fault,project_delay_client_fault,weather,unforeseen'],
            'overtime_rate_multiplier' => ['nullable', 'numeric', 'min:0'],
            'is_billable_to_client' => ['nullable', 'boolean'],
            'include_in_final_balance' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        // Re-compute hours from clock_in/clock_out if provided
        if (! empty($validated['clock_in']) && ! empty($validated['clock_out'])) {
            $start = \Carbon\Carbon::parse($validated['clock_in']);
            $end = \Carbon\Carbon::parse($validated['clock_out']);
            if ($end->lt($start)) {
                $end->addDay();
            }
            $breakMinutes = (int) ($validated['break_minutes'] ?? 0);
            $totalMinutes = max(0, $start->diffInMinutes($end) - $breakMinutes);
            $totalHours = round($totalMinutes / 60, 2);

            $projectWorker = ProjectWorker::find($projectLaborLog->project_worker_id);
            [$regularHours, $overtimeHours] = $this->splitHoursByTiers($projectWorker, $totalHours);

            $validated['regular_hours'] = $regularHours;
            $validated['overtime_hours'] = $overtimeHours;
        }

        $validated['regular_hours'] = $validated['regular_hours'] ?? $projectLaborLog->regular_hours;

        // Re-run auto-approval check
        $overtimeHours = $validated['overtime_hours'] ?? 0;
        $hasOvertime = (float) $overtimeHours > 0;

        $hasSchedule = ProjectWorkerSchedule::where('project_id', $projectLaborLog->project_id)
            ->where('worker_id', $projectLaborLog->worker_id)
            ->where('scheduled_date', $validated['log_date'])
            ->whereIn('status', [
                \App\Enums\ProjectScheduleDayStatus::Accepted->value,
                \App\Enums\ProjectScheduleDayStatus::Pending->value,
            ])
            ->exists();

        if ($hasSchedule && ! $hasOvertime) {
            $validated['status'] = ProjectLogStatus::Approved;
            $validated['approved_at'] = now()->toDateTimeString();
            $validated['is_auto_approved'] = true;
        } else {
            $validated['status'] = ProjectLogStatus::Submitted;
            $validated['approved_at'] = null;
            $validated['is_auto_approved'] = false;
        }

        $projectLaborLog->update($validated);

        return response()->json([
            'success' => true,
            'data' => ProjectLaborLogData::fromModel($projectLaborLog->fresh()->load(['worker', 'submittedBy', 'approvedBy'])),
        ]);
    }

    /**
     * Delete a labor log (only when not approved).
     */
    public function destroy(ProjectLaborLog $projectLaborLog): JsonResponse
    {
        $this->authorize('update', $projectLaborLog->project);

        abort_if(
            $projectLaborLog->status === ProjectLogStatus::Approved,
            422,
            'I log approvati non possono essere eliminati.'
        );

        $projectLaborLog->delete();

        return response()->json(['success' => true], 200);
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

    /**
     * PM manually changes the status of a labor log.
     */
    public function changeStatus(Request $request, ProjectLaborLog $projectLaborLog): JsonResponse
    {
        $this->authorize('update', $projectLaborLog->project);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:draft,submitted,approved,rejected'],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:500'],
        ]);

        $newStatus = ProjectLogStatus::from($validated['status']);

        $projectLaborLog->update([
            'status' => $newStatus,
            'rejection_reason' => $newStatus === ProjectLogStatus::Rejected ? $validated['rejection_reason'] : $projectLaborLog->rejection_reason,
            'approved_by_user_id' => $newStatus === ProjectLogStatus::Approved ? auth()->id() : $projectLaborLog->approved_by_user_id,
            'approved_at' => $newStatus === ProjectLogStatus::Approved ? now()->toDateTimeString() : $projectLaborLog->approved_at,
            'is_auto_approved' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => ProjectLaborLogData::fromModel($projectLaborLog->fresh()->load(['worker', 'submittedBy', 'approvedBy'])),
        ]);
    }

    /**
     * Split total hours into [regular, overtime] based on the worker's rate threshold.
     */
    private function splitHoursByTiers(ProjectWorker $projectWorker, float $totalHours): array
    {
        $threshold = 8.0; // default standard day

        if ($projectWorker->worker_id) {
            $workerRate = WorkerRate::where('worker_id', $projectWorker->worker_id)
                ->where('context', RateContext::InternalCost)
                ->where('rate_type', RateType::Hourly)
                ->current()
                ->first();

            if ($workerRate && $workerRate->overtime_starts_after_hours !== null) {
                $threshold = (float) $workerRate->overtime_starts_after_hours;
            }
        }

        return [
            round(min($totalHours, $threshold), 2),
            round(max(0.0, $totalHours - $threshold), 2),
        ];
    }
}
