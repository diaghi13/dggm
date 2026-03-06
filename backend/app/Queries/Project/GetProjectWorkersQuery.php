<?php

namespace App\Queries\Project;

use App\Models\ProjectWorker;
use Illuminate\Database\Eloquent\Collection;

class GetProjectWorkersQuery
{
    /**
     * Execute the query for project workers.
     *
     * @param  array{status?: string, is_active?: bool}  $filters
     */
    public static function execute(int $projectId, array $filters = []): Collection
    {
        $query = ProjectWorker::query()
            ->where('project_id', $projectId)
            ->with(['worker', 'assignedBy', 'roles']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderBy('created_at', 'asc')->get();
    }
}
