<?php

namespace App\Actions\Project;

use App\Models\ProjectMaterial;
use Illuminate\Support\Facades\DB;

class UpdateProjectMaterialAction
{
    public function execute(ProjectMaterial $projectMaterial, array $data): ProjectMaterial
    {
        return DB::transaction(function () use ($projectMaterial, $data) {
            $projectMaterial->update($data);

            return $projectMaterial->fresh(['product']);
        });
    }
}
