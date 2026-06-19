<?php

namespace App\Queries\FinalBalance;

use App\Domains\Project\Models\Project;
use Illuminate\Database\Eloquent\Collection;

class GetProjectFinalBalancesQuery
{
    public function __construct(
        private readonly Project $project
    ) {}

    public function execute(): Collection
    {
        return $this->project->finalBalances()
            ->with(['customer', 'createdBy', 'finalizedBy', 'approvedBy'])
            ->orderByDesc('created_at')
            ->get();
    }
}
