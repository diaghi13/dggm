<?php

namespace App\Queries\Project;

use App\Models\Project;
use App\Models\ProjectLaborLog;

class GetOvertimeSummaryQuery
{
    public function __construct(private readonly Project $project) {}

    public function execute(): array
    {
        $logs = ProjectLaborLog::query()
            ->where('project_id', $this->project->id)
            ->where('overtime_hours', '>', 0)
            ->with(['laborCost'])
            ->get();

        $byGroup = $logs
            ->groupBy(function ($log) {
                $cause = $log->overtime_cause?->value ?? 'none';
                $billable = $log->is_billable_to_client ? '1' : '0';

                return "{$cause}|{$billable}";
            })
            ->map(function ($group) {
                $first = $group->first();
                $totalOvertimeHours = $group->sum(fn ($l) => (float) ($l->overtime_hours ?? 0));
                $totalCost = $group->sum(fn ($l) => (float) $l->overtime_cost);

                return [
                    'overtime_cause' => $first->overtime_cause?->value,
                    'overtime_cause_label' => $first->overtime_cause?->name,
                    'is_billable_to_client' => (bool) $first->is_billable_to_client,
                    'count' => $group->count(),
                    'total_overtime_hours' => round($totalOvertimeHours, 2),
                    'total_cost' => round($totalCost, 2),
                ];
            })
            ->values()
            ->toArray();

        $totalOvertimeHours = $logs->sum(fn ($l) => (float) ($l->overtime_hours ?? 0));
        $totalBillableHours = $logs->where('is_billable_to_client', true)->sum(fn ($l) => (float) ($l->overtime_hours ?? 0));

        return [
            'by_cause' => $byGroup,
            'summary' => [
                'total_overtime_hours' => round($totalOvertimeHours, 2),
                'total_billable_hours' => round($totalBillableHours, 2),
                'total_non_billable_hours' => round($totalOvertimeHours - $totalBillableHours, 2),
            ],
        ];
    }
}
