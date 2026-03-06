<?php

namespace App\Queries\Project;

use App\Models\ProjectLaborCost;
use Illuminate\Support\Facades\DB;

class GetProjectLaborCostBreakdownQuery
{
    /**
     * Execute the query to get labor cost breakdown by type for a project.
     *
     * @return array<string, array{cost_type: string, total_cost: float, total_hours: float, entries_count: int}>
     */
    public static function execute(int $projectId): array
    {
        $breakdown = ProjectLaborCost::query()
            ->where('project_id', $projectId)
            ->select([
                'cost_type',
                DB::raw('SUM(total_cost) as total_cost'),
                DB::raw('SUM(hours_worked) as total_hours'),
                DB::raw('COUNT(*) as entries_count'),
            ])
            ->groupBy('cost_type')
            ->orderBy('total_cost', 'desc')
            ->get();

        $result = [];

        foreach ($breakdown as $row) {
            $costType = $row->cost_type ?? 'other';
            $result[$costType] = [
                'cost_type' => $costType,
                'total_cost' => (float) $row->total_cost,
                'total_hours' => (float) $row->total_hours,
                'entries_count' => (int) $row->entries_count,
            ];
        }

        return $result;
    }
}
