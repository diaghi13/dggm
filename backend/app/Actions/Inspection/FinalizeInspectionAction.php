<?php

namespace App\Actions\Inspection;

use App\Events\RentalReturnInspectionCompleted;
use App\Models\RentalReturnInspection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class FinalizeInspectionAction
{
    public function execute(RentalReturnInspection $inspection): RentalReturnInspection
    {
        return DB::transaction(function () use ($inspection) {
            if (! $inspection->allItemsReviewed()) {
                throw new RuntimeException('All items must be reviewed before finalizing inspection.');
            }

            $inspection->update(['status' => 'completed']);

            RentalReturnInspectionCompleted::dispatch($inspection);

            return $inspection->fresh()->load('items');
        });
    }
}
