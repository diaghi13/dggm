<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectExpense;
use App\Enums\ProjectExpenseStatus;
use Illuminate\Support\Facades\DB;

class RejectProjectExpenseAction
{
    public function execute(ProjectExpense $expense, int $rejectedByUserId, string $reason): ProjectExpense
    {
        return DB::transaction(function () use ($expense, $rejectedByUserId, $reason) {
            $expense->update([
                'status' => ProjectExpenseStatus::Rejected,
                'approved_by_user_id' => $rejectedByUserId,
                'approved_at' => now(),
                'rejection_reason' => $reason,
            ]);

            return $expense->fresh();
        });
    }
}
