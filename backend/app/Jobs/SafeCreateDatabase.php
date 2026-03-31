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
use Stancl\Tenancy\Database\DatabaseManager;
use Stancl\Tenancy\Events\CreatingDatabase;
use Stancl\Tenancy\Events\DatabaseCreated;
use Stancl\Tenancy\Exceptions\TenantDatabaseAlreadyExistsException;

/**
 * Idempotent wrapper around stancl's CreateDatabase.
 *
 * On retry (DB already exists):
 *  - status = 'ready' → stop pipeline, nothing to do.
 *  - otherwise        → skip creation and continue the pipeline so
 *                       MigrateDatabase + SeedDatabase + BootstrapTenantJob can retry.
 */
class SafeCreateDatabase implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected TenantWithDatabase $tenant) {}

    public function handle(DatabaseManager $databaseManager): ?bool
    {
        event(new CreatingDatabase($this->tenant));

        if ($this->tenant->getInternal('create_database') === false) {
            return false;
        }

        $this->tenant->database()->makeCredentials();

        try {
            $databaseManager->ensureTenantCanBeCreated($this->tenant);
            $this->tenant->database()->manager()->createDatabase($this->tenant);
        } catch (TenantDatabaseAlreadyExistsException) {
            Log::info('SafeCreateDatabase: database already exists, skipping creation.', [
                'tenant_id' => $this->tenant->id,
                'bootstrap_status' => $this->tenant->bootstrap_status,
            ]);

            if ($this->tenant->bootstrap_status === 'ready') {
                return false; // Nothing left to do — stop the pipeline.
            }
            // Otherwise let the pipeline continue so the remaining steps can retry.
        }

        event(new DatabaseCreated($this->tenant));

        return null;
    }
}
