<?php

namespace App\Actions\Project;

use App\Enums\ProjectExpenseStatus;
use App\Events\ProjectExpenseApproved;
use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class CreateProjectExpenseAction
{
    public function execute(Project $project, array $data, int $submittedByUserId): ProjectExpense
    {
        return DB::transaction(function () use ($project, $data, $submittedByUserId) {
            $amount = (float) ($data['amount'] ?? 0);
            $threshold = (float) Setting::get('project.expense_auto_approve_threshold', 50);

            $autoApprove = $amount <= $threshold && $threshold > 0;

            $expense = ProjectExpense::create([
                ...$data,
                'project_id' => $project->id,
                'submitted_by_user_id' => $submittedByUserId,
                'status' => $autoApprove
                    ? ProjectExpenseStatus::AutoApproved
                    : ProjectExpenseStatus::Submitted,
                'approved_by_user_id' => $autoApprove ? null : null,
                'approved_at' => $autoApprove ? now() : null,
            ]);

            if ($autoApprove) {
                ProjectExpenseApproved::dispatch($expense, [
                    'auto_approved' => true,
                    'submitted_by' => $submittedByUserId,
                ]);
            }

            return $expense->load(['project', 'submittedBy', 'projectWorker']);
        });
    }
}
