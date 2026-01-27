<?php

namespace App\Actions\Ddt;

use App\Enums\DdtStatus;
use App\Events\DdtCancelled;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class CancelDdtAction
{
    public function execute(Ddt $ddt, string $reason): Ddt
    {
        if (! in_array($ddt->status, [DdtStatus::Issued, DdtStatus::InTransit])) {
            throw new \Exception("DDT cannot be cancelled. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt, $reason) {
            // Update status
            $existingNotes = $ddt->notes ? $ddt->notes."\n\n" : '';
            $ddt->update([
                'status' => DdtStatus::Cancelled,
                'notes' => $existingNotes."CANCELLED: {$reason}",
            ]);

            // Dispatch event - ReverseStockMovementsListener will reverse movements
            DdtCancelled::dispatch($ddt->fresh(['stockMovements.product', 'items.product']), $reason, auth()->id());

            return $ddt->fresh(['stockMovements.product', 'items.product', 'fromWarehouse', 'toWarehouse', 'supplier', 'customer', 'site']);
        });
    }
}
