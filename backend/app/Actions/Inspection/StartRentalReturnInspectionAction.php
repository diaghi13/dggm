<?php

namespace App\Actions\Inspection;

use App\Domains\Warehouse\Models\Ddt;
use App\Domains\Warehouse\Models\RentalReturnInspection;
use App\Domains\Warehouse\Models\RentalReturnInspectionItem;
use App\Enums\DdtType;
use App\Events\RentalReturnInspectionStarted;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StartRentalReturnInspectionAction
{
    public function execute(Ddt $ddt): RentalReturnInspection
    {
        return DB::transaction(function () use ($ddt) {
            if ($ddt->type !== DdtType::RentalReturn) {
                throw new InvalidArgumentException('DDT must be of type rental_return to start inspection.');
            }

            $inspection = RentalReturnInspection::create([
                'ddt_id' => $ddt->id,
                'project_id' => $ddt->project_id,
                'inspected_by_user_id' => auth()->id(),
                'inspection_date' => today()->format('Y-m-d'),
                'status' => 'in_progress',
            ]);

            // Create one item per DDT item
            $ddt->loadMissing('items');

            foreach ($ddt->items as $ddtItem) {
                RentalReturnInspectionItem::create([
                    'inspection_id' => $inspection->id,
                    'ddt_item_id' => $ddtItem->id,
                    'product_id' => $ddtItem->product_id,
                    'total_quantity' => $ddtItem->quantity,
                    'quantity_good' => 0,
                    'quantity_damaged' => 0,
                    'quantity_write_off' => 0,
                ]);
            }

            RentalReturnInspectionStarted::dispatch($inspection);

            return $inspection->load('items.product', 'items.ddtItem', 'ddt');
        });
    }
}
