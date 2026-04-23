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
                'clock_in' => $data['clock_in'] ?? null,
                'clock_out' => $data['clock_out'] ?? null,
                'break_minutes' => $data['break_minutes'] ?? 0,
                'regular_hours' => $data['regular_hours'],
                'overtime_hours' => $data['overtime_hours'] ?? 0,
                'overtime_cause' => $data['overtime_cause'] ?? null,
                'overtime_rate_type' => $data['overtime_rate_type'] ?? null,
                'overtime_rate_multiplier' => $data['overtime_rate_multiplier'] ?? null,
                'overtime_direct_rate' => $data['overtime_direct_rate'] ?? null,
                'is_billable_to_client' => $data['is_billable_to_client'] ?? false,
                'include_in_final_balance' => $data['include_in_final_balance'] ?? true,
                'description' => $data['description'] ?? null,
                'submitted_by_user_id' => $submittedByUserId,
                'status' => $data['status'] ?? ProjectLogStatus::Submitted,
                'approved_at' => $data['approved_at'] ?? null,
                'is_auto_approved' => $data['is_auto_approved'] ?? false,
            ]);
        });
    }
}
