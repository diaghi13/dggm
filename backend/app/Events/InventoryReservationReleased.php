<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * InventoryReservationReleased Event
 *
 * Triggered when a previously reserved inventory is released back to available stock.
 *
 * Listeners:
 * - LogInventoryReservationListener - Audit trail for reservation releases
 */
class InventoryReservationReleased
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Inventory $inventory,
        public readonly float $quantity,
        public readonly ?int $siteId = null,
        public readonly ?int $userId = null
    ) {}
}
