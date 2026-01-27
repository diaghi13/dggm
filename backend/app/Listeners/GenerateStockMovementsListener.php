<?php

namespace App\Listeners;

use App\Enums\DdtType;
use App\Enums\StockMovementType;
use App\Events\DdtConfirmed;
use App\Events\StockMovementCreated;
use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * GenerateStockMovementsListener
 *
 * CRITICAL LISTENER - Generates stock movements when a DDT is confirmed.
 *
 * This is the core business logic that was previously in DdtService.
 * Must run synchronously (NOT queued) to ensure movements are created before response.
 */
class GenerateStockMovementsListener
{
    public function handle(DdtConfirmed $event): void
    {
        $ddt = $event->ddt->fresh(['items.product', 'fromWarehouse', 'toWarehouse']);

        DB::transaction(function () use ($ddt) {
            match ($ddt->type) {
                DdtType::Incoming => $this->processIncoming($ddt),
                DdtType::Outgoing => $this->processOutgoing($ddt),
                DdtType::Internal => $this->processInternal($ddt),
                DdtType::RentalOut => $this->processRentalOut($ddt),
                DdtType::RentalReturn => $this->processRentalReturn($ddt),
                DdtType::ReturnFromCustomer => $this->processReturnFromCustomer($ddt),
                DdtType::ReturnToSupplier => $this->processReturnToSupplier($ddt),
            };

            Log::info('Stock movements generated for DDT', [
                'ddt_id' => $ddt->id,
                'ddt_code' => $ddt->code,
                'type' => $ddt->type->value,
                'items_count' => $ddt->items->count(),
            ]);
        });
    }

    /**
     * Process incoming DDT (from supplier)
     * Creates INTAKE movements, increases warehouse stock
     */
    private function processIncoming($ddt): void
    {
        foreach ($ddt->items as $item) {
            // Create stock movement
            $movement = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::INTAKE,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'supplier_id' => $ddt->supplier_id,
                'supplier_document' => $ddt->ddt_number,
                'user_id' => $ddt->created_by,
                'notes' => "DDT Incoming: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            // Update inventory
            $this->updateInventory($item->product_id, $ddt->from_warehouse_id, $item->quantity, 'add');

            // Dispatch event
            StockMovementCreated::dispatch($movement);
        }
    }

    /**
     * Process outgoing DDT (to customer/site)
     * Creates OUTPUT movements, decreases warehouse stock
     */
    private function processOutgoing($ddt): void
    {
        foreach ($ddt->items as $item) {
            // Create stock movement
            $movement = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::OUTPUT,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'site_id' => $ddt->site_id,
                'user_id' => $ddt->created_by,
                'notes' => "DDT Outgoing: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            // Update inventory
            $this->updateInventory($item->product_id, $ddt->from_warehouse_id, -$item->quantity, 'remove');

            // Dispatch event
            StockMovementCreated::dispatch($movement);
        }
    }

    /**
     * Process internal transfer DDT
     * Creates TRANSFER movements, decreases from_warehouse, increases to_warehouse
     */
    private function processInternal($ddt): void
    {
        foreach ($ddt->items as $item) {
            // Create outgoing movement
            $movementOut = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'from_warehouse_id' => $ddt->from_warehouse_id,
                'to_warehouse_id' => $ddt->to_warehouse_id,
                'type' => StockMovementType::TRANSFER,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'user_id' => $ddt->created_by,
                'notes' => "Transfer OUT: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            // Create incoming movement
            $movementIn = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->to_warehouse_id,
                'from_warehouse_id' => $ddt->from_warehouse_id,
                'to_warehouse_id' => $ddt->to_warehouse_id,
                'type' => StockMovementType::TRANSFER,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'user_id' => $ddt->created_by,
                'notes' => "Transfer IN: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            // Update inventories
            $this->updateInventory($item->product_id, $ddt->from_warehouse_id, -$item->quantity, 'remove');
            $this->updateInventory($item->product_id, $ddt->to_warehouse_id, $item->quantity, 'add');

            // Dispatch events
            StockMovementCreated::dispatch($movementOut);
            StockMovementCreated::dispatch($movementIn);
        }
    }

    /**
     * Process rental out DDT
     * Creates RENTAL_OUT movements, decreases warehouse stock, tracks as rented
     */
    private function processRentalOut($ddt): void
    {
        foreach ($ddt->items as $item) {
            $movement = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::RENTAL_OUT,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'site_id' => $ddt->site_id,
                'user_id' => $ddt->created_by,
                'notes' => "Rental OUT: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            $this->updateInventory($item->product_id, $ddt->from_warehouse_id, -$item->quantity, 'remove');
            StockMovementCreated::dispatch($movement);
        }
    }

    /**
     * Process rental return DDT
     * Creates RENTAL_RETURN movements, increases warehouse stock
     */
    private function processRentalReturn($ddt): void
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
                'site_id' => $ddt->site_id,
                'user_id' => $ddt->created_by,
                'notes' => "Rental RETURN: {$ddt->code}",
                'reference_document' => $ddt->code,
            ]);

            $this->updateInventory($item->product_id, $ddt->from_warehouse_id, $item->quantity, 'add');
            StockMovementCreated::dispatch($movement);
        }
    }

    /**
     * Process return from customer DDT
     * Creates RETURN movements, increases warehouse stock
     */
    private function processReturnFromCustomer($ddt): void
    {
        foreach ($ddt->items as $item) {
            $movement = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::RETURN,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'user_id' => $ddt->created_by,
                'notes' => "Return from customer: {$ddt->code} - Reason: {$ddt->return_reason?->value}",
                'reference_document' => $ddt->code,
            ]);

            $this->updateInventory($item->product_id, $ddt->from_warehouse_id, $item->quantity, 'add');
            StockMovementCreated::dispatch($movement);
        }
    }

    /**
     * Process return to supplier DDT
     * Creates RETURN movements, decreases warehouse stock
     */
    private function processReturnToSupplier($ddt): void
    {
        foreach ($ddt->items as $item) {
            $movement = StockMovement::create([
                'ddt_id' => $ddt->id,
                'product_id' => $item->product_id,
                'warehouse_id' => $ddt->from_warehouse_id,
                'type' => StockMovementType::RETURN,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'movement_date' => $ddt->ddt_date,
                'supplier_id' => $ddt->supplier_id,
                'user_id' => $ddt->created_by,
                'notes' => "Return to supplier: {$ddt->code} - Reason: {$ddt->return_reason?->value}",
                'reference_document' => $ddt->code,
            ]);

            $this->updateInventory($item->product_id, $ddt->from_warehouse_id, -$item->quantity, 'remove');
            StockMovementCreated::dispatch($movement);
        }
    }

    /**
     * Update inventory quantity
     */
    private function updateInventory(int $productId, int $warehouseId, float $quantityChange, string $operation): void
    {
        $inventory = Inventory::firstOrCreate(
            [
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
            ],
            [
                'quantity_available' => 0,
                'quantity_reserved' => 0,
                'quantity_in_transit' => 0,
                'quantity_quarantine' => 0,
            ]
        );

        if ($operation === 'add') {
            $inventory->quantity_available += abs($quantityChange);
        } else {
            $inventory->quantity_available -= abs($quantityChange);
        }

        $inventory->save();
    }
}
