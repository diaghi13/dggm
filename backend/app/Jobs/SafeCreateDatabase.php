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
 *  - status = 'ready'                     → stop pipeline, nothing to do.
 *  - DB has migrations but not bootstrapped → dispatch BootstrapTenantJob independently,
 *                                             stop pipeline (avoids re-running MigrateDatabase).
 *  - DB has no migrations yet             → continue pipeline (MigrateDatabase + BootstrapTenantJob).
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
                Log::info('SafeCreateDatabase: tenant already ready, stopping pipeline.', [
                    'tenant_id' => $this->tenant->id,
                ]);

                return false;
            }

            // Check if migrations have already been applied.
            // If yes, MigrateDatabase would fail on re-run (MySQL DDL is not transactional).
            // Dispatch BootstrapTenantJob as an independent job and stop the pipeline.
            $migrationsRecorded = $this->tenant->run(
                fn () => \Illuminate\Support\Facades\DB::table('migrations')->count()
            );

            if ($migrationsRecorded > 0) {
                Log::info('SafeCreateDatabase: DB already migrated, dispatching BootstrapTenantJob independently.', [
                    'tenant_id' => $this->tenant->id,
                    'migrations_count' => $migrationsRecorded,
                ]);

                dispatch(new BootstrapTenantJob($this->tenant));

                return false; // Stop pipeline — MigrateDatabase must not run again
            }

            // DB exists but not yet migrated — continue the pipeline normally.
            event(new DatabaseCreated($this->tenant));
        }

        return null;
    }
}
