<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Project\CreateWorkerScheduleAction;
use App\Data\ProjectWorkerScheduleData;
use App\Enums\ProjectScheduleDayStatus;
use App\Enums\ProjectWorkerStatus;
use App\Http\Controllers\Controller;
use App\Models\ProjectWorker;
use App\Models\ProjectWorkerSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectWorkerScheduleController extends Controller
{
    /**
     * List all schedule days for a project worker slot.
     */
    public function index(ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('view', $projectWorker);

        $schedules = $projectWorker->schedules()
            ->orderBy('scheduled_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::collect($schedules),
        ]);
    }

    /**
     * Create a schedule day (PM only).
     */
    public function store(Request $request, ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('update', $projectWorker);

        $validated = $request->validate([
            'scheduled_date' => ['required', 'date'],
            'planned_start_time' => ['nullable', 'date_format:H:i'],
            'planned_end_time' => ['nullable', 'date_format:H:i'],
            'planned_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'notes' => ['nullable', 'string'],
            'cost_rate' => ['nullable', 'numeric', 'min:0'],
            'customer_rate' => ['nullable', 'numeric', 'min:0'],
        ]);

        $schedule = app(CreateWorkerScheduleAction::class)->execute($projectWorker, $validated);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::fromModel($schedule),
        ], 201);
    }

    /**
     * Show a single schedule day.
     */
    public function show(ProjectWorkerSchedule $projectWorkerSchedule): JsonResponse
    {
        $projectWorker = $this->resolveProjectWorker($projectWorkerSchedule);
        $this->authorize('view', $projectWorker);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::fromModel($projectWorkerSchedule),
        ]);
    }

    /**
     * Update a schedule day (PM only). Only allowed in Pending or Modified status.
     */
    public function update(Request $request, ProjectWorkerSchedule $projectWorkerSchedule): JsonResponse
    {
        $projectWorker = $this->resolveProjectWorker($projectWorkerSchedule);
        $this->authorize('update', $projectWorker);

        $validated = $request->validate([
            'planned_start_time' => ['nullable', 'date_format:H:i'],
            'planned_end_time' => ['nullable', 'date_format:H:i'],
            'planned_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'notes' => ['nullable', 'string'],
            'cost_rate' => ['nullable', 'numeric', 'min:0'],
            'customer_rate' => ['nullable', 'numeric', 'min:0'],
        ]);

        // If previously accepted, mark as modified (may require re-acceptance)
        if ($projectWorkerSchedule->status === ProjectScheduleDayStatus::Accepted) {
            $validated['status'] = ProjectScheduleDayStatus::Modified;
        }

        $projectWorkerSchedule->update($validated);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::fromModel($projectWorkerSchedule->fresh()),
        ]);
    }

    /**
     * Delete a schedule day (PM only, only if Pending/Modified).
     */
    public function destroy(ProjectWorkerSchedule $projectWorkerSchedule): JsonResponse
    {
        $projectWorker = $this->resolveProjectWorker($projectWorkerSchedule);
        $this->authorize('update', $projectWorker);

        $projectWorkerSchedule->delete();

        return response()->json(['success' => true], 204);
    }

    /**
     * Worker accepts a single scheduled day.
     * If this is the first accepted day, the ProjectWorker assignment is activated.
     */
    public function accept(ProjectWorkerSchedule $projectWorkerSchedule): JsonResponse
    {
        $projectWorker = $this->resolveProjectWorker($projectWorkerSchedule);
        $this->authorize('respond', $projectWorker);

        abort_if(
            $projectWorkerSchedule->status !== ProjectScheduleDayStatus::Pending
                && $projectWorkerSchedule->status !== ProjectScheduleDayStatus::Modified,
            422,
            'Questa giornata non è in attesa di risposta.'
        );

        $projectWorkerSchedule->update([
            'status' => ProjectScheduleDayStatus::Accepted,
            'accepted_at' => now(),
        ]);

        // Activate the assignment when the worker accepts at least one day
        if ($projectWorker->status === ProjectWorkerStatus::Pending) {
            $projectWorker->update([
                'status' => ProjectWorkerStatus::Active,
                'responded_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::fromModel($projectWorkerSchedule->fresh()),
        ]);
    }

    /**
     * Worker rejects a single scheduled day.
     */
    public function reject(Request $request, ProjectWorkerSchedule $projectWorkerSchedule): JsonResponse
    {
        $projectWorker = $this->resolveProjectWorker($projectWorkerSchedule);
        $this->authorize('respond', $projectWorker);

        abort_if(
            $projectWorkerSchedule->status !== ProjectScheduleDayStatus::Pending
                && $projectWorkerSchedule->status !== ProjectScheduleDayStatus::Modified,
            422,
            'Questa giornata non è in attesa di risposta.'
        );

        $validated = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $projectWorkerSchedule->update([
            'status' => ProjectScheduleDayStatus::Rejected,
            'rejected_at' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::fromModel($projectWorkerSchedule->fresh()),
        ]);
    }

    /**
     * Auto-generate schedule days for a project worker between two dates.
     * POST /project-workers/{projectWorker}/generate-schedule
     */
    public function generateSchedule(Request $request, ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('update', $projectWorker);

        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'skip_weekends' => ['boolean'],
            'replace' => ['boolean'],
        ]);

        $startTime = $validated['start_time'] ?? '09:00';
        $endTime = $validated['end_time'] ?? '18:00';
        $skipWeekends = (bool) ($validated['skip_weekends'] ?? false);
        $replace = (bool) ($validated['replace'] ?? false);

        if ($replace) {
            $projectWorker->schedules()->delete();
        }

        $schedules = collect();
        $current = \Carbon\Carbon::parse($validated['start_date'])->startOfDay();
        $end = \Carbon\Carbon::parse($validated['end_date'])->startOfDay();

        while ($current->lte($end)) {
            if (! $skipWeekends || ! $current->isWeekend()) {
                $schedule = ProjectWorkerSchedule::updateOrCreate(
                    [
                        'project_id' => $projectWorker->project_id,
                        'worker_id' => $projectWorker->worker_id,
                        'scheduled_date' => $current->toDateString(),
                    ],
                    [
                        'planned_start_time' => $startTime,
                        'planned_end_time' => $endTime,
                        'status' => ProjectScheduleDayStatus::Pending,
                        'cost_rate' => $projectWorker->actual_cost_rate,
                        'customer_rate' => $projectWorker->customer_rate,
                    ]
                );
                $schedules->push($schedule);
            }
            $current->addDay();
        }

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::collect($schedules),
            'meta' => ['generated_count' => $schedules->count()],
        ]);
    }

    /**
     * Resolve a ProjectWorker from a schedule for authorization purposes.
     * Since a schedule is now keyed by (project_id, worker_id), we find any
     * ProjectWorker row for that combination to use with the policy.
     */
    private function resolveProjectWorker(ProjectWorkerSchedule $schedule): ProjectWorker
    {
        return ProjectWorker::where('project_id', $schedule->project_id)
            ->where('worker_id', $schedule->worker_id)
            ->firstOrFail();
    }

    /**
     * Delete ALL schedule days for a project worker (bulk clear).
     * DELETE /project-workers/{projectWorker}/schedules
     */
    public function destroyAll(ProjectWorker $projectWorker): JsonResponse
    {
        $this->authorize('update', $projectWorker);

        $projectWorker->schedules()->delete();

        return response()->json(['success' => true, 'message' => 'Tutte le convocazioni eliminate.']);
    }
}
