<?php

namespace App\Domains\Warehouse\Actions\Ddt;

use App\Domains\Warehouse\Actions\Bom\ExplodeBomComponentsAction;
use App\Domains\Warehouse\Models\Ddt;
use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;

class ProcessRentalOutDdtAction
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
                'type' => StockMovementType::RENTAL_OUT,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost ?? $item->product?->standard_cost,
                'movement_date' => $ddt->ddt_date,
                'project_id' => $ddt->project_id,
                'user_id' => $ddt->created_by,
                'notes' => "Rental OUT: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            // Modello B: fleet (quantity_available) stays the same — only out_on_rental moves
            Inventory::firstOrCreate(
                ['product_id' => $item->product_id, 'warehouse_id' => $ddt->from_warehouse_id],
                ['quantity_available' => 0, 'quantity_reserved' => 0, 'quantity_in_transit' => 0, 'quantity_quarantine' => 0, 'quantity_out_on_rental' => 0],
            )->increment('quantity_out_on_rental', $item->quantity);

            StockMovementCreated::dispatch($movement);

            $this->explodeBom->execute($item->product_id, $ddt->from_warehouse_id, $item->quantity, 'out', $ddt);
        }
    }
}
