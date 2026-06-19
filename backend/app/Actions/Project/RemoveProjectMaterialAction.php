<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\ProjectMaterial;
use Illuminate\Support\Facades\DB;

class RemoveProjectMaterialAction
{
    public function execute(ProjectMaterial $projectMaterial): void
    {
        DB::transaction(function () use ($projectMaterial) {
            $projectMaterial->delete();
        });
    }
}
