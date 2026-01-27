<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DdtCreated Event
 *
 * Triggered when a new DDT is created (Draft status).
 *
 * Listeners:
 * - LogDdtActivityListener - Audit trail for DDT creation
 */
class DdtCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly ?int $userId = null
    ) {}
}
