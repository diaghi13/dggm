<?php

namespace App\Domains\Warehouse\Actions\Ddt;

use App\Domains\Warehouse\Data\DdtData;
use App\Domains\Warehouse\Models\Ddt;
use App\Enums\DdtStatus;
use App\Events\DdtCreated;
use Illuminate\Support\Facades\DB;

class CreateDdtAction
{
    public function execute(DdtData $data): Ddt
    {
        return DB::transaction(function () use ($data) {
            // Create DDT
            $ddtData = $data->except('items')->toArray();
            $ddtData['status'] = DdtStatus::Draft;
            $ddtData['code'] = Ddt::generateCode();
            $ddtData['created_by'] = auth()->id();

            $ddt = Ddt::create($ddtData);

            // Create items
            if ($data->items) {
                foreach ($data->items as $itemData) {
                    $ddt->items()->create($itemData->except('id', 'ddt_id')->toArray());
                }
            }

            // Dispatch event
            DdtCreated::dispatch($ddt, auth()->id());

            return $ddt->fresh(['items.product', 'fromWarehouse', 'toWarehouse', 'supplier', 'customer', 'project']);
        });
    }
}
