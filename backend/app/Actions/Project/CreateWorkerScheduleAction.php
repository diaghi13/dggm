<?php

namespace App\Actions\Project;

use App\Enums\ProjectScheduleDayStatus;
use App\Models\ProjectWorker;
use App\Models\ProjectWorkerSchedule;
use Illuminate\Support\Facades\DB;

class CreateWorkerScheduleAction
{
    /**
     * Create a single schedule day for a project worker slot.
     * If a record for the same (project_worker_id, scheduled_date) already
     * exists, it updates it instead (upsert behaviour).
     */
    public function execute(ProjectWorker $projectWorker, array $data): ProjectWorkerSchedule
    {
        return DB::transaction(function () use ($projectWorker, $data) {
            $schedule = ProjectWorkerSchedule::updateOrCreate(
                [
                    'project_worker_id' => $projectWorker->id,
                    'scheduled_date' => $data['scheduled_date'],
                ],
                [
                    'planned_start_time' => $data['planned_start_time'] ?? null,
                    'planned_end_time' => $data['planned_end_time'] ?? null,
                    'planned_hours' => $data['planned_hours'] ?? null,
                    'status' => $data['status'] ?? ProjectScheduleDayStatus::Pending,
                    'notes' => $data['notes'] ?? null,
                ]
            );

            return $schedule;
        });
    }
}
