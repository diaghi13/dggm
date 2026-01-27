<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DdtDelivered Event
 *
 * Triggered when DDT is marked as delivered.
 *
 * CRITICAL: For outgoing DDTs to sites, must update site_materials table.
 *
 * Listeners:
 * - UpdateSiteMaterialsListener (CRITICAL) - Updates site_materials table for outgoing DDTs to sites
 * - NotifyRecipientListener - Sends delivery notification
 * - LogDdtActivityListener - Audit trail
 */
class DdtDelivered
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly string $deliveredAt,
        public readonly ?int $userId = null
    ) {}
}
