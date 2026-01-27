<?php

namespace App\Listeners;

use App\Events\DdtCancelled;
use App\Events\DdtConfirmed;
use App\Events\DdtCreated;
use App\Events\DdtDeleted;
use App\Events\DdtDelivered;
use App\Events\DdtUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * LogDdtActivityListener
 *
 * Logs all DDT lifecycle events for comprehensive audit trail.
 * Queued for performance.
 */
class LogDdtActivityListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(DdtCreated|DdtUpdated|DdtConfirmed|DdtCancelled|DdtDelivered|DdtDeleted $event): void
    {
        $action = match (true) {
            $event instanceof DdtCreated => 'created',
            $event instanceof DdtUpdated => 'updated',
            $event instanceof DdtConfirmed => 'confirmed',
            $event instanceof DdtCancelled => 'cancelled',
            $event instanceof DdtDelivered => 'delivered',
            $event instanceof DdtDeleted => 'deleted',
        };

        $data = match (true) {
            $event instanceof DdtDeleted => [
                'ddt_id' => $event->ddtId,
                'ddt_code' => $event->ddtCode,
                'user_id' => $event->userId,
            ],
            $event instanceof DdtUpdated => [
                'ddt_id' => $event->ddt->id,
                'ddt_code' => $event->ddt->code,
                'changes' => $event->changes,
                'user_id' => $event->userId,
            ],
            $event instanceof DdtCancelled => [
                'ddt_id' => $event->ddt->id,
                'ddt_code' => $event->ddt->code,
                'reason' => $event->reason,
                'user_id' => $event->userId,
            ],
            $event instanceof DdtDelivered => [
                'ddt_id' => $event->ddt->id,
                'ddt_code' => $event->ddt->code,
                'delivered_at' => $event->deliveredAt,
                'user_id' => $event->userId,
            ],
            default => [
                'ddt_id' => $event->ddt->id,
                'ddt_code' => $event->ddt->code,
                'ddt_type' => $event->ddt->type->value,
                'ddt_status' => $event->ddt->status->value,
                'user_id' => $event->userId,
            ],
        };

        Log::info("DDT {$action}", $data);
    }
}
