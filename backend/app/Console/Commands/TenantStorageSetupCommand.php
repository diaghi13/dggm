<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Ensures the central tenants/ directory exists with the correct ownership
 * and creates the Laravel public storage symlink.
 *
 * Run this command during deployment (as the deploy user / root) BEFORE
 * starting the queue worker (www-data). This prevents the queue worker
 * from failing with a "not writable" error when it tries to create
 * per-tenant symlinks inside storage/app/public/tenants/.
 *
 * Usage:
 *   php artisan tenant:storage-setup
 *
 * Typical deploy script entry (after composer install):
 *   php artisan tenant:storage-setup
 *   chown -R www-data:www-data storage/
 *   php artisan queue:restart
 */
class TenantStorageSetupCommand extends Command
{
    protected $signature = 'tenant:storage-setup';

    protected $description = 'Prepare central tenant storage directory and public symlink (run as deploy user before queue worker starts)';

    public function handle(): int
    {
        $tenantsDir = base_path('storage/app/public/tenants');

        if (! is_dir($tenantsDir)) {
            mkdir($tenantsDir, 0755, true);
            $this->info("Created: {$tenantsDir}");
            Log::info('TenantStorageSetupCommand: created tenants directory', ['path' => $tenantsDir]);
        } else {
            $this->line("Already exists: {$tenantsDir}");
        }

        // Ensure the standard Laravel public storage symlink exists.
        // public/storage → storage/app/public
        $publicStorageLink = public_path('storage');

        if (! file_exists($publicStorageLink) && ! is_link($publicStorageLink)) {
            $this->call('storage:link');
            Log::info('TenantStorageSetupCommand: created public storage symlink');
        } else {
            $this->line('Public storage symlink already exists, skipping storage:link.');
        }

        $this->info('Tenant storage setup complete.');
        $this->line('');
        $this->line('Next step: ensure www-data owns the storage directory:');
        $this->line('  chown -R www-data:www-data '.base_path('storage'));

        return self::SUCCESS;
    }
}
