<?php

namespace App\Actions\Project;

use App\Enums\ProjectLogStatus;
use App\Models\ProjectLaborLog;
use App\Models\ProjectWorker;
use Illuminate\Support\Facades\DB;

class LogLaborHoursAction
{
    public function execute(ProjectWorker $projectWorker, array $data, int $submittedByUserId): ProjectLaborLog
    {
        return DB::transaction(function () use ($projectWorker, $data, $submittedByUserId) {
            return ProjectLaborLog::create([
                'project_id' => $projectWorker->project_id,
                'project_worker_id' => $projectWorker->id,
                'worker_id' => $projectWorker->worker_id,
                'schedule_day_id' => $data['schedule_day_id'] ?? null,
                'log_date' => $data['log_date'],
                'regular_hours' => $data['regular_hours'],
                'overtime_hours' => $data['overtime_hours'] ?? 0,
                'description' => $data['description'] ?? null,
                'submitted_by_user_id' => $submittedByUserId,
                'status' => ProjectLogStatus::Submitted,
            ]);
        });
    }
}
