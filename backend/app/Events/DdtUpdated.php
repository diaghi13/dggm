<?php

namespace App\Events;

use App\Models\Ddt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DdtUpdated Event
 *
 * Triggered when a DDT is updated (Draft status only).
 *
 * Listeners:
 * - LogDdtActivityListener - Audit trail for DDT updates
 */
class DdtUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Ddt $ddt,
        public readonly array $changes,
        public readonly ?int $userId = null
    ) {}
}
