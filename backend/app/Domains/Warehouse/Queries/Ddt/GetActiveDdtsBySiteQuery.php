<?php

namespace App\Domains\Warehouse\Queries\Ddt;

use App\Domains\Warehouse\Models\Ddt;
use App\Enums\DdtStatus;
use App\Enums\DdtType;
use Illuminate\Database\Eloquent\Collection;

readonly class GetActiveDdtsBySiteQuery
{
    public function __construct(
        private int $projectId
    ) {}

    public function execute(): Collection
    {
        return Ddt::where('project_id', $this->projectId)
            ->whereIn('status', [DdtStatus::Issued, DdtStatus::InTransit])
            ->where('type', DdtType::Outgoing)
            ->with(['items.product', 'fromWarehouse'])
            ->orderBy('ddt_date', 'desc')
            ->get();
    }
}
