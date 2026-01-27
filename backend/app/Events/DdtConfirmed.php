<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DdtConfirmed Event
 *
 * Triggered when DDT status changes from Draft to Issued.
 *
 * CRITICAL: This is the main trigger for stock movements generation.
 *
 * Listeners:
 * - GenerateStockMovementsListener (CRITICAL) - Creates stock movements based on DDT type
 * - NotifyWarehouseManagerListener - Sends notification
 * - LogDdtActivityListener - Audit trail
 */
class DdtConfirmed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly ?int $userId = null
    ) {}
}
