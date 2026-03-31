<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\TenantActivated;
use App\Mail\TenantActivatedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendTenantActivationEmailListener implements ShouldQueue
{
    public function handle(TenantActivated $event): void
    {
        try {
            Mail::send(new TenantActivatedMail($event->tenant, $event->adminUser));
        } catch (Throwable $e) {
            Log::warning('Failed to send tenant activation email', [
                'tenant_id' => $event->tenant->id,
                'email' => $event->adminUser->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
