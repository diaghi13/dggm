<?php

namespace App\Queries\Inspection;

use App\Domains\Warehouse\Models\Ddt;
use App\Enums\DdtType;
use Illuminate\Database\Eloquent\Collection;

/**
 * GetPendingRentalReturnInspectionsQuery
 *
 * Returns DDTs of type rental_return that either:
 * - Have no inspection yet (need to be started), or
 * - Have an inspection with status=in_progress (need to be completed).
 */
class GetPendingRentalReturnInspectionsQuery
{
    public function execute(): Collection
    {
        return Ddt::query()
            ->where('type', DdtType::RentalReturn)
            ->where(function ($query) {
                $query
                    ->whereDoesntHave('inspection')
                    ->orWhereHas('inspection', fn ($q) => $q->where('status', 'in_progress'));
            })
            ->with([
                'project:id,name,code',
                'inspection:id,ddt_id,status,inspection_date,inspected_by_user_id',
                'items.product:id,name,code',
            ])
            ->orderByDesc('ddt_date')
            ->get();
    }
}
