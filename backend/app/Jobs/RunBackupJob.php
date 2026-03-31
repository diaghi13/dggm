<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class RunBackupJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public int $tries = 1;

    public function __construct(public readonly string $type = 'all') {}

    public function handle(): void
    {
        Log::info('Manual backup triggered via UI', ['type' => $this->type]);

        if (in_array($this->type, ['central', 'all'], true)) {
            Artisan::call('backup:run', ['--only-db' => true]);
            Log::info('Central backup completed.');
        }

        if (in_array($this->type, ['tenants', 'all'], true)) {
            Artisan::call('backup:tenants');
            Log::info('Tenant backups completed.');
        }
    }
}
