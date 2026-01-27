<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * DdtDeleted Event
 *
 * Triggered when a DDT is soft deleted (Draft status only).
 *
 * Listeners:
 * - LogDdtActivityListener - Audit trail for DDT deletion
 */
class DdtDeleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int $ddtId,
        public readonly string $ddtCode,
        public readonly ?int $userId = null
    ) {}
}
