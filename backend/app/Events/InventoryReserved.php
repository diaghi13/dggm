<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * InventoryReserved Event
 *
 * Triggered when inventory is reserved for a site or order.
 *
 * Listeners:
 * - LogInventoryReservationListener - Audit trail for reservations
 */
class InventoryReserved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Inventory $inventory,
        public readonly float $quantity,
        public readonly ?int $siteId = null,
        public readonly ?int $userId = null
    ) {}
}
