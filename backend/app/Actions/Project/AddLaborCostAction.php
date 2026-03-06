<?php

namespace App\Actions\Project;

use App\Models\Project;
use App\Models\ProjectLaborCost;
use Illuminate\Support\Facades\DB;

class AddLaborCostAction
{
    public function execute(Project $project, array $data): ProjectLaborCost
    {
        return DB::transaction(function () use ($project, $data) {
            $cost = $project->laborCosts()->create($data);

            // Recalculate total_cost if not explicitly provided
            if (! isset($data['total_cost'])) {
                $cost->calculateTotalCost();
                $cost->saveQuietly();
            }

            $project->updateActualCost();

            return $cost->load(['worker', 'contractor']);
        });
    }
}
