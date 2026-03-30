<?php

namespace App\Actions\Project;

use App\Enums\LaborCostType;
use App\Enums\ProjectLogStatus;
use App\Events\LaborLogApproved;
use App\Models\ProjectLaborCost;
use App\Models\ProjectLaborLog;
use Illuminate\Support\Facades\DB;

class ApproveLaborLogAction
{
    public function execute(ProjectLaborLog $log, int $approvedByUserId): ProjectLaborLog
    {
        return DB::transaction(function () use ($log, $approvedByUserId) {
            // Determine the cost rate: slot's hourly_rate_override → actual_cost_rate → 0
            $slot = $log->projectWorker;
            $hourlyRate = $slot->hourly_rate_override
                ?? $slot->actual_cost_rate
                ?? 0;

            $totalHours = (float) $log->regular_hours + (float) $log->overtime_hours;

            $laborCost = ProjectLaborCost::create([
                'project_id' => $log->project_id,
                'cost_type' => $slot->is_external ? LaborCostType::Contractor : LaborCostType::InternalLabor,
                'worker_id' => $log->worker_id,
                'description' => $log->description ?? "Ore lavorate – {$log->log_date->format('d/m/Y')}",
                'work_date' => $log->log_date,
                'hours_worked' => $totalHours,
                'quantity' => 1,
                'unit_rate' => $hourlyRate,
                'total_cost' => $hourlyRate * $totalHours,
                'is_overtime' => (float) $log->overtime_hours > 0,
                'is_holiday' => false,
                'currency' => 'EUR',
            ]);

            // Update the project's actual_cost
            $log->project->updateActualCost();

            // Mark the log as approved and link the cost record
            $log->update([
                'status' => ProjectLogStatus::Approved,
                'approved_by_user_id' => $approvedByUserId,
                'approved_at' => now(),
                'labor_cost_id' => $laborCost->id,
            ]);

            LaborLogApproved::dispatch($log, $laborCost, [
                'approved_by' => $approvedByUserId,
            ]);

            return $log->fresh()->load(['projectWorker', 'worker', 'laborCost']);
        });
    }
}
