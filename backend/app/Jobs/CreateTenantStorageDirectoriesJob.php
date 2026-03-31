<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

class CreateTenantStorageDirectoriesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected TenantWithDatabase $tenant) {}

    public function handle(): void
    {
        // Initialize tenancy so storage_path() is tenant-scoped
        tenancy()->initialize($this->tenant);

        try {
            // Create the tenant-scoped storage directories
            $directories = [
                storage_path('app'),
                storage_path('app/public'),
                storage_path('framework/cache'),
                storage_path('framework/sessions'),
                storage_path('framework/views'),
                storage_path('logs'),
            ];

            foreach ($directories as $dir) {
                if (! is_dir($dir)) {
                    mkdir($dir, 0755, true);
                    Log::info('CreateTenantStorageDirectoriesJob: created directory', [
                        'tenant_id' => $this->tenant->getTenantKey(),
                        'path' => $dir,
                    ]);
                }
            }
        } finally {
            tenancy()->end();
        }
    }
}
