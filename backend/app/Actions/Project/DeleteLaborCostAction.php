<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectLaborCost;
use Illuminate\Support\Facades\DB;

class DeleteLaborCostAction
{
    public function execute(ProjectLaborCost $laborCost): void
    {
        DB::transaction(function () use ($laborCost) {
            $project = $laborCost->project;

            $laborCost->delete();

            $project->updateActualCost();
        });
    }
}
