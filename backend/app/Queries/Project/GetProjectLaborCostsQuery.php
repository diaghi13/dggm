<?php

namespace App\Queries\Project;

use App\Models\ProjectLaborCost;
use Illuminate\Database\Eloquent\Collection;

class GetProjectLaborCostsQuery
{
    /**
     * Execute the query for project labor costs.
     *
     * @param  array{cost_type?: string, worker_id?: int, contractor_id?: int, is_invoiced?: bool, from_date?: string, to_date?: string}  $filters
     */
    public static function execute(int $projectId, array $filters = []): Collection
    {
        $query = ProjectLaborCost::query()
            ->where('project_id', $projectId)
            ->with(['worker', 'contractor']);

        if (! empty($filters['cost_type'])) {
            $query->where('cost_type', $filters['cost_type']);
        }

        if (! empty($filters['worker_id'])) {
            $query->where('worker_id', $filters['worker_id']);
        }

        if (! empty($filters['contractor_id'])) {
            $query->where('contractor_id', $filters['contractor_id']);
        }

        if (isset($filters['is_invoiced'])) {
            $query->where('is_invoiced', filter_var($filters['is_invoiced'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['from_date'])) {
            $query->where('work_date', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->where('work_date', '<=', $filters['to_date']);
        }

        return $query->orderBy('work_date', 'desc')->get();
    }
}
