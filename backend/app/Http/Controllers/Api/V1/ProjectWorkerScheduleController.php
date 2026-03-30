<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Project\CreateWorkerScheduleAction;
use App\Data\ProjectWorkerScheduleData;
use App\Enums\ProjectScheduleDayStatus;
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
        $this->authorize('view', $projectWorkerSchedule->projectWorker);

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
        $this->authorize('update', $projectWorkerSchedule->projectWorker);

        $validated = $request->validate([
            'planned_start_time' => ['nullable', 'date_format:H:i'],
            'planned_end_time' => ['nullable', 'date_format:H:i'],
            'planned_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'notes' => ['nullable', 'string'],
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
        $this->authorize('update', $projectWorkerSchedule->projectWorker);

        $projectWorkerSchedule->delete();

        return response()->json(['success' => true], 204);
    }

    /**
     * Worker accepts a scheduled day.
     */
    public function accept(ProjectWorkerSchedule $projectWorkerSchedule): JsonResponse
    {
        $this->authorize('respond', $projectWorkerSchedule->projectWorker);

        $projectWorkerSchedule->update([
            'status' => ProjectScheduleDayStatus::Accepted,
            'accepted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::fromModel($projectWorkerSchedule->fresh()),
        ]);
    }

    /**
     * Worker rejects a scheduled day.
     */
    public function reject(Request $request, ProjectWorkerSchedule $projectWorkerSchedule): JsonResponse
    {
        $this->authorize('respond', $projectWorkerSchedule->projectWorker);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $projectWorkerSchedule->update([
            'status' => ProjectScheduleDayStatus::Rejected,
            'rejected_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'success' => true,
            'data' => ProjectWorkerScheduleData::fromModel($projectWorkerSchedule->fresh()),
        ]);
    }
}
