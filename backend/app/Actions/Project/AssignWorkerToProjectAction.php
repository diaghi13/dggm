<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectWorker;
use App\Enums\ProjectWorkerStatus;
use App\Enums\WorkerType;
use App\Models\Worker;
use App\Notifications\WorkerAssignedToProject;
use Illuminate\Support\Facades\DB;

class AssignWorkerToProjectAction
{
    public function execute(Project $project, Worker $worker, array $data, int $assignedByUserId): ProjectWorker
    {
        return DB::transaction(function () use ($project, $worker, $data, $assignedByUserId) {
            // External workers require acceptance; internal workers are immediately active
            $status = $worker->worker_type === WorkerType::External
                ? ProjectWorkerStatus::Pending
                : ProjectWorkerStatus::Active;

            $projectWorker = ProjectWorker::create([
                ...$data,
                'project_id' => $project->id,
                'worker_id' => $worker->id,
                'status' => $status,
                'assigned_by_user_id' => $assignedByUserId,
                'response_due_at' => $status === ProjectWorkerStatus::Pending
                    ? now()->addDays(3)
                    : null,
            ]);

            // Send notification to external workers requiring acceptance
            if ($status === ProjectWorkerStatus::Pending && $worker->user) {
                $worker->user->notify(new WorkerAssignedToProject($projectWorker));
            }

            return $projectWorker->load(['worker.user', 'project', 'assignedBy']);
        });
    }
}
