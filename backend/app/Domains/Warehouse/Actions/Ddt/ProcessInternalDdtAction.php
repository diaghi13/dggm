<?php

namespace App\Domains\Warehouse\Actions\Ddt;

use App\Domains\Warehouse\Models\Ddt;
use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\StockMovement;
use App\Enums\StockMovementType;
use App\Events\StockMovementCreated;

class ProcessInternalDdtAction
{
    public function execute(Ddt $ddt): void
    {
        foreach ($ddt->items as $item) {
            $unitCost = $item->unit_cost ?? $item->product?->standard_cost;

            $movementOut = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'from_warehouse_id' => $ddt->from_warehouse_id,
                'to_warehouse_id' => $ddt->to_warehouse_id,
                'type' => StockMovementType::TRANSFER,
                'quantity' => $item->quantity,
                'unit_cost' => $unitCost,
                'movement_date' => $ddt->ddt_date,
                'user_id' => $ddt->created_by,
                'notes' => "Transfer OUT: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            $movementIn = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->to_warehouse_id,
                'from_warehouse_id' => $ddt->from_warehouse_id,
                'to_warehouse_id' => $ddt->to_warehouse_id,
                'type' => StockMovementType::TRANSFER,
                'quantity' => $item->quantity,
                'unit_cost' => $unitCost,
                'movement_date' => $ddt->ddt_date,
                'user_id' => $ddt->created_by,
                'notes' => "Transfer IN: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            Inventory::firstOrCreate(
                ['product_id' => $item->product_id, 'warehouse_id' => $ddt->from_warehouse_id],
                ['quantity_available' => 0, 'quantity_reserved' => 0, 'quantity_in_transit' => 0, 'quantity_quarantine' => 0, 'quantity_out_on_rental' => 0],
            )->decrement('quantity_available', $item->quantity);

            Inventory::firstOrCreate(
                ['product_id' => $item->product_id, 'warehouse_id' => $ddt->to_warehouse_id],
                ['quantity_available' => 0, 'quantity_reserved' => 0, 'quantity_in_transit' => 0, 'quantity_quarantine' => 0, 'quantity_out_on_rental' => 0],
            )->increment('quantity_available', $item->quantity);

            StockMovementCreated::dispatch($movementOut);
            StockMovementCreated::dispatch($movementIn);
        }
    }
}
