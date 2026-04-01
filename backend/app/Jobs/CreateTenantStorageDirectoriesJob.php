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

        $this->createPublicStorageSymlink();

        if ($this->tenant instanceof Tenant) {
            $this->tenant->update(['bootstrap_status' => BootstrapStatus::StorageReady->value]);
        }
    }

    /**
     * Create a symlink inside the central public storage so tenant files
     * are accessible via /storage/tenants/{tenant_id}/...
     */
    protected function createPublicStorageSymlink(): void
    {
        $tenantId = $this->tenant->getTenantKey();
        $tenantsDir = base_path('storage/app/public/tenants');

        // Verify the parent directory exists and is writable before attempting
        // to create the symlink. If root owns this directory and www-data is the
        // queue worker, the symlink creation will silently fail or throw a cryptic
        // permission error. We surface a clear, actionable message instead.
        if (is_dir($tenantsDir) && ! is_writable($tenantsDir)) {
            $realPath = realpath($tenantsDir);
            throw new \RuntimeException(
                'Directory storage/app/public/tenants/ is not writable by the current process. '.
                "Run on the server: chown -R www-data:www-data {$realPath} ".
                'Alternatively, run `php artisan tenant:storage-setup` as the deploy user before starting the queue worker.'
            );
        }

        if (! is_dir($tenantsDir)) {
            mkdir($tenantsDir, 0755, true);
        }

        $symlinkPath = $tenantsDir.'/'.$tenantId;

        // is_link() returns true even for broken symlinks (target does not exist yet).
        // file_exists() returns false for broken symlinks.
        // Both checks together cover: valid symlink, broken symlink, and the job
        // being retried after a previous attempt already created the link.
        if (is_link($symlinkPath)) {
            Log::info('CreateTenantStorageDirectoriesJob: symlink already exists, skipping', [
                'tenant_id' => $tenantId,
                'symlink' => $symlinkPath,
                'target' => readlink($symlinkPath),
            ]);

            return;
        }

        if (file_exists($symlinkPath)) {
            Log::warning('CreateTenantStorageDirectoriesJob: path exists but is not a symlink, skipping', [
                'tenant_id' => $tenantId,
                'symlink' => $symlinkPath,
            ]);

            return;
        }

        // Relative path from storage/app/public/tenants/ to the tenant storage
        $target = '../../../erp_tenant_'.$tenantId.'/app/public/';

        if (! symlink($target, $symlinkPath)) {
            throw new \RuntimeException(
                "Failed to create symlink: {$symlinkPath} → {$target}"
            );
        }

        Log::info('CreateTenantStorageDirectoriesJob: created public symlink', [
            'tenant_id' => $tenantId,
            'symlink' => $symlinkPath,
            'target' => $target,
        ]);
    }
}
