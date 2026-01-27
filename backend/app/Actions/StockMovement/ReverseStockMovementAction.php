<?php

namespace App\Actions\StockMovement;

use App\Enums\StockMovementType;
use App\Events\StockMovementReversed;
use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class ReverseStockMovementAction
{
    public function execute(int $movementId, string $reason): StockMovement
    {
        return DB::transaction(function () use ($movementId, $reason) {
            $originalMovement = StockMovement::findOrFail($movementId);

            // Create compensating movement
            $reversingMovement = StockMovement::create([
                'code' => StockMovement::generateCode(),
                'product_id' => $originalMovement->product_id,
                'warehouse_id' => $originalMovement->warehouse_id,
                'type' => $this->getOppositeType($originalMovement->type),
                'quantity' => $originalMovement->quantity,
                'unit_cost' => $originalMovement->unit_cost,
                'movement_date' => now(),
                'from_warehouse_id' => $originalMovement->to_warehouse_id,
                'to_warehouse_id' => $originalMovement->from_warehouse_id,
                'user_id' => auth()->id(),
                'notes' => "Reversal of movement {$originalMovement->code}. Reason: {$reason}",
                'reference_document' => "REV-{$originalMovement->code}",
            ]);

            // Reverse inventory changes
            $this->reverseInventoryChanges($originalMovement);

            // Dispatch event
            StockMovementReversed::dispatch($originalMovement, $reversingMovement, $reason);

            return $reversingMovement->fresh(['product', 'warehouse', 'user']);
        });
    }

    private function getOppositeType(StockMovementType $type): StockMovementType
    {
        return match ($type) {
            StockMovementType::INTAKE => StockMovementType::OUTPUT,
            StockMovementType::OUTPUT => StockMovementType::INTAKE,
            StockMovementType::TRANSFER => StockMovementType::TRANSFER,
            default => StockMovementType::ADJUSTMENT,
        };
    }

    private function reverseInventoryChanges(StockMovement $movement): void
    {
        match ($movement->type) {
            StockMovementType::INTAKE => $this->reverseIntake($movement),
            StockMovementType::OUTPUT => $this->reverseOutput($movement),
            StockMovementType::TRANSFER => $this->reverseTransfer($movement),
            StockMovementType::ADJUSTMENT => $this->reverseAdjustment($movement),
            default => null,
        };
    }

    private function reverseIntake(StockMovement $movement): void
    {
        // Intake added stock, so reversal removes it
        $inventory = Inventory::where('product_id', $movement->product_id)
            ->where('warehouse_id', $movement->warehouse_id)
            ->lockForUpdate()
            ->firstOrFail();

        $inventory->quantity_available -= $movement->quantity;
        $inventory->save();
    }

    private function reverseOutput(StockMovement $movement): void
    {
        // Output removed stock, so reversal adds it back
        $inventory = Inventory::where('product_id', $movement->product_id)
            ->where('warehouse_id', $movement->warehouse_id)
            ->lockForUpdate()
            ->firstOrFail();

        $inventory->quantity_available += $movement->quantity;
        $inventory->save();
    }

    private function reverseTransfer(StockMovement $movement): void
    {
        // Reverse transfer: add back to from_warehouse, remove from to_warehouse
        if ($movement->from_warehouse_id) {
            $fromInventory = Inventory::where('product_id', $movement->product_id)
                ->where('warehouse_id', $movement->from_warehouse_id)
                ->lockForUpdate()
                ->firstOrFail();

            $fromInventory->quantity_available += $movement->quantity;
            $fromInventory->save();
        }

        if ($movement->to_warehouse_id) {
            $toInventory = Inventory::where('product_id', $movement->product_id)
                ->where('warehouse_id', $movement->to_warehouse_id)
                ->lockForUpdate()
                ->firstOrFail();

            $toInventory->quantity_available -= $movement->quantity;
            $toInventory->save();
        }
    }

    private function reverseAdjustment(StockMovement $movement): void
    {
        // Reverse the adjustment
        $inventory = Inventory::where('product_id', $movement->product_id)
            ->where('warehouse_id', $movement->warehouse_id)
            ->lockForUpdate()
            ->firstOrFail();

        // Check if original was positive or negative by checking notes
        $wasPositive = str_contains($movement->notes ?? '', 'increase') || $movement->quantity > 0;

        if ($wasPositive) {
            $inventory->quantity_available -= $movement->quantity;
        } else {
            $inventory->quantity_available += $movement->quantity;
        }

        $inventory->save();
    }
}
