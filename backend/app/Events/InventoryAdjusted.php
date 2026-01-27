<?php

namespace App\Events;

use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * InventoryAdjusted Event
 *
 * Triggered when inventory quantity is manually adjusted.
 *
 * Listeners:
 * - LogInventoryAdjustmentListener - Audit trail for adjustments
 */
class InventoryAdjusted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Inventory $inventory,
        public readonly StockMovement $movement,
        public readonly float $oldQuantity,
        public readonly float $newQuantity,
        public readonly ?int $userId = null
    ) {}
}
