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
 * Behaviour on retry (DB already exists):
 *  - If tenant is already 'ready'  → stop pipeline (return false), nothing to do.
 *  - Otherwise (failed/bootstrapping) → skip creation, let MigrateDatabase + BootstrapTenantJob retry.
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
            event(new DatabaseCreated($this->tenant));
        } catch (TenantDatabaseAlreadyExistsException) {
            $status = $this->tenant->bootstrap_status;

            Log::info('SafeCreateDatabase: database already exists.', [
                'tenant_id' => $this->tenant->id,
                'bootstrap_status' => $status,
            ]);

            if ($status === 'ready') {
                // Fully bootstrapped — nothing left to do, stop the pipeline.
                Log::info('SafeCreateDatabase: tenant already ready, stopping pipeline.', [
                    'tenant_id' => $this->tenant->id,
                ]);

                return false;
            }

            // DB exists but bootstrap is incomplete — let the pipeline continue
            // so MigrateDatabase and BootstrapTenantJob can finish the work.
            event(new DatabaseCreated($this->tenant));
        }

        return null;
    }
}
