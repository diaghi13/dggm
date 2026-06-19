<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectExpense;
use App\Enums\ProjectExpenseStatus;
use App\Events\ProjectExpenseApproved;
use Illuminate\Support\Facades\DB;

class ApproveProjectExpenseAction
{
    public function execute(ProjectExpense $expense, int $approvedByUserId): ProjectExpense
    {
        return DB::transaction(function () use ($expense, $approvedByUserId) {
            $expense->update([
                'status' => ProjectExpenseStatus::Approved,
                'approved_by_user_id' => $approvedByUserId,
                'approved_at' => now(),
            ]);

            ProjectExpenseApproved::dispatch($expense, [
                'approved_by' => $approvedByUserId,
            ]);

            return $expense->fresh()->load(['project', 'submittedBy', 'approvedBy']);
        });
    }
}
