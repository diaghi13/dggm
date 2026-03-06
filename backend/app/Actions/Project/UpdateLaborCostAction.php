<?php

namespace App\Actions\Project;

use App\Models\ProjectLaborCost;
use Illuminate\Support\Facades\DB;

class UpdateLaborCostAction
{
    public function execute(ProjectLaborCost $laborCost, array $data): ProjectLaborCost
    {
        return DB::transaction(function () use ($laborCost, $data) {
            $laborCost->update($data);

            $laborCost->project->updateActualCost();

            return $laborCost->fresh(['worker', 'contractor']);
        });
    }
}
