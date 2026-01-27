<?php

namespace App\Actions\Ddt;

use App\Enums\DdtStatus;
use App\Events\DdtDelivered;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class DeliverDdtAction
{
    public function execute(Ddt $ddt): Ddt
    {
        if (! in_array($ddt->status, [DdtStatus::Issued, DdtStatus::InTransit])) {
            throw new \Exception("DDT cannot be delivered. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt) {
            $deliveredAt = now();

            // Update status and delivery date
            $ddt->update([
                'status' => DdtStatus::Delivered,
                'delivered_at' => $deliveredAt,
            ]);

            // Dispatch event - UpdateSiteMaterialsListener will update site_materials if needed
            DdtDelivered::dispatch($ddt->fresh(['items.product', 'site']), $deliveredAt->toISOString(), auth()->id());

            return $ddt->fresh(['items.product', 'stockMovements.product', 'fromWarehouse', 'toWarehouse', 'supplier', 'customer', 'site']);
        });
    }
}
