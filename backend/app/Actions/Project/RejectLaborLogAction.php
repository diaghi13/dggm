<?php

namespace App\Actions\Project;

use App\Enums\ProjectLogStatus;
use App\Models\ProjectLaborLog;
use Illuminate\Support\Facades\DB;

class RejectLaborLogAction
{
    public function execute(ProjectLaborLog $log, int $rejectedByUserId, string $reason): ProjectLaborLog
    {
        return DB::transaction(function () use ($log, $rejectedByUserId, $reason) {
            $log->update([
                'status' => ProjectLogStatus::Rejected,
                'approved_by_user_id' => $rejectedByUserId,
                'approved_at' => now(),
                'rejection_reason' => $reason,
            ]);

            return $log->fresh();
        });
    }
}
