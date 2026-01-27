<?php

namespace App\Actions\Ddt;

use App\Enums\DdtStatus;
use App\Events\DdtDeleted;
use App\Models\Ddt;
use Illuminate\Support\Facades\DB;

class DeleteDdtAction
{
    public function execute(Ddt $ddt): bool
    {
        // Only Draft can be deleted
        if ($ddt->status !== DdtStatus::Draft) {
            throw new \Exception("Only Draft DDTs can be deleted. Current status: {$ddt->status->value}");
        }

        return DB::transaction(function () use ($ddt) {
            $ddtId = $ddt->id;
            $ddtCode = $ddt->code;

            $ddt->delete(); // Soft delete

            // Dispatch event
            DdtDeleted::dispatch($ddtId, $ddtCode, auth()->id());

            return true;
        });
    }
}
