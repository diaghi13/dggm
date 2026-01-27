<?php

namespace App\Actions\Ddt;

use App\Data\DdtData;
use App\Enums\DdtStatus;
use App\Events\DdtCreated;
use App\Models\Ddt;
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

            return $ddt->fresh(['items.product', 'fromWarehouse', 'toWarehouse', 'supplier', 'customer', 'site']);
        });
    }
}
