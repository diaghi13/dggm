<?php

namespace App\Actions\Project;

use App\Domains\Project\Models\Project;
use Illuminate\Support\Facades\DB;

class DeleteProjectAction
{
    public function execute(Project $project): void
    {
        DB::transaction(function () use ($project) {
            $project->delete();
        });
    }
}
