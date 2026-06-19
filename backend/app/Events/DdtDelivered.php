<?php

namespace App\Events;

use App\Domains\Warehouse\Models\Ddt;
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
 * - UpdateProjectMaterialQuantitiesListener (CRITICAL) - Updates project_materials table for outgoing DDTs to projects
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
