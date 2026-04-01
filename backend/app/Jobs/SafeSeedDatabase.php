<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\BootstrapStatus;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

/**
 * Wrapper around stancl's SeedDatabase that also updates bootstrap_status
 * so admins can track exactly where in the pipeline a tenant is.
 */
class SafeSeedDatabase implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected TenantWithDatabase $tenant) {}

    public function handle(): void
    {
        $tenantKey = $this->tenant->getTenantKey();

        Artisan::call('tenants:seed', [
            '--tenants' => [$tenantKey],
        ]);

        Log::info('SafeSeedDatabase: seeding completed.', [
            'tenant_id' => $tenantKey,
        ]);

        if ($this->tenant instanceof Tenant) {
            $this->tenant->update(['bootstrap_status' => BootstrapStatus::Seeded->value]);
        }
    }
}
