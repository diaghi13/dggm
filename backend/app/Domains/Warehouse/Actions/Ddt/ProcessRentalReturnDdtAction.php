<?php

namespace App\Domains\Warehouse\Actions\Ddt;

use App\Domains\Warehouse\Actions\Bom\ExplodeBomComponentsAction;
use App\Domains\Warehouse\Models\Ddt;
use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;
use Illuminate\Support\Facades\Log;

class ProcessRentalReturnDdtAction
{
    public function __construct(
        private readonly ExplodeBomComponentsAction $explodeBom,
    ) {}

    public function execute(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            $movement = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::RENTAL_RETURN,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'project_id' => $ddt->project_id,
                'user_id' => $ddt->created_by,
                'notes' => "Rental RETURN: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            // Modello B: fleet stays the same — only out_on_rental moves back
            $inventory = Inventory::where('product_id', $item->product_id)
                ->where('warehouse_id', $ddt->from_warehouse_id)
                ->first();

            if ($inventory && $inventory->quantity_out_on_rental >= $item->quantity) {
                $inventory->decrement('quantity_out_on_rental', $item->quantity);
            } else {
                Log::warning('Rental return: quantity_out_on_rental insufficient or inventory not found', [
                    'ddt_id' => $ddt->id,
                    'product_id' => $item->product_id,
                    'warehouse_id' => $ddt->from_warehouse_id,
                    'requested' => $item->quantity,
                    'available' => $inventory?->quantity_out_on_rental ?? 0,
                ]);
            }

            StockMovementCreated::dispatch($movement);

            $this->explodeBom->execute($item->product_id, $ddt->from_warehouse_id, $item->quantity, 'in', $ddt);
        }
    }
}
