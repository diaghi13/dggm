<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class CreateTenantsStorageCommand extends Command
{
    protected $signature = 'tenants:storage:create {--tenant= : Specific tenant ID}';

    protected $description = 'Create storage directories for all tenants (run after enabling FilesystemTenancyBootstrapper)';

    public function handle(): int
    {
        $tenants = $this->option('tenant')
            ? Tenant::where('id', $this->option('tenant'))->get()
            : Tenant::all();

        foreach ($tenants as $tenant) {
            $tenant->run(function () use ($tenant) {
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
                    }
                }

                $this->info("Storage created for tenant: {$tenant->id} ({$tenant->name})");
            });
        }

        $this->info('Done!');

        return self::SUCCESS;
    }
}
