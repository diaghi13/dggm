<?php

namespace App\Actions\Ddt;

use App\Data\DdtData;
use App\Enums\DdtStatus;
use App\Events\DdtUpdated;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class UpdateDdtAction
{
    public function execute(Ddt $ddt, DdtData $data): Ddt
    {
        // Only Draft can be edited (per confirmed decision)
        if ($ddt->status !== DdtStatus::Draft) {
            throw new \Exception("DDT can only be edited in Draft status. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt, $data) {
            // Capture changes before update
            $originalAttributes = $ddt->getAttributes();

            // Update DDT (exclude items, status, created_by, code)
            $updateData = $data->except('items', 'status', 'created_by', 'code', 'id')->toArray();
            $ddt->update($updateData);

            // Calculate changes
            $changes = array_diff_assoc($ddt->getAttributes(), $originalAttributes);

            // Sync items
            if ($data->items) {
                $ddt->items()->delete();
                foreach ($data->items as $itemData) {
                    $ddt->items()->create($itemData->except('id', 'ddt_id')->toArray());
                }
            }

            // Dispatch event
            DdtUpdated::dispatch($ddt, $changes, auth()->id());

            return $ddt->fresh(['items.product', 'fromWarehouse', 'toWarehouse', 'supplier', 'customer', 'site']);
        });
    }
}
