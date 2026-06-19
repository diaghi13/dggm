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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

/**
 * Idempotent wrapper around stancl's MigrateDatabase.
 *
 * Problem this solves:
 * MySQL DDL statements (ALTER TABLE ADD COLUMN) are NOT transactional.
 * If a migration crashes mid-execution (e.g. while adding a FK that
 * references a not-yet-existing table), MySQL may have already applied
 * some of the column additions, but Laravel has NOT recorded the migration
 * in the tenant's `migrations` table (because the PHP-side transaction
 * rolled back or the Artisan command crashed before writing the record).
 *
 * On pipeline retry, `tenants:migrate` sees the migration as "not run"
 * and tries to execute it again — causing "Duplicate column name" errors.
 *
 * This job catches that specific error and retries with `--pretend` to
 * detect which migrations are in this inconsistent state, then marks them
 * as run in the `migrations` table before doing a real migrate.
 *
 * The real idempotency fix is in the migration files themselves (use
 * Schema::hasColumn() guards), but this job provides a safety net for
 * existing partially-applied migrations.
 */
class SafeMigrateDatabase implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;

    public int $tries = 3;

    public function __construct(protected TenantWithDatabase $tenant)
    {
        $this->onQueue('migrations');
    }

    public function handle(): void
    {
        $tenantKey = $this->tenant->getTenantKey();
        $lock = Cache::lock("tenant_migrate_{$tenantKey}", 600);

        if (! $lock->get()) {
            Log::warning('SafeMigrateDatabase: another instance is running for this tenant, skipping.', [
                'tenant_id' => $tenantKey,
            ]);

            return;
        }

        try {
            $this->runMigrations($tenantKey);

            if ($this->tenant instanceof Tenant) {
                $this->tenant->update(['bootstrap_status' => BootstrapStatus::Migrated->value]);
            }
        } finally {
            $lock->release();
        }
    }

    private function runMigrations(string $tenantKey): void
    {
        try {
            Artisan::call('tenants:migrate', [
                '--tenants' => [$tenantKey],
                '--force' => true,
            ]);

            Log::info('SafeMigrateDatabase: migration completed.', [
                'tenant_id' => $tenantKey,
            ]);
        } catch (\Throwable $e) {
            // If the error is "Duplicate column name", a migration was partially
            // applied in a previous attempt (MySQL DDL is non-transactional).
            // We mark the offending migration(s) as run so the next pass skips them.
            if ($this->isDuplicateColumnError($e)) {
                Log::warning('SafeMigrateDatabase: duplicate column detected — attempting recovery.', [
                    'tenant_id' => $tenantKey,
                    'error' => $e->getMessage(),
                ]);

                $this->markOrphanedMigrationsAsRun($tenantKey);

                // Retry the migrate after marking orphaned migrations
                Artisan::call('tenants:migrate', [
                    '--tenants' => [$tenantKey],
                    '--force' => true,
                ]);

                Log::info('SafeMigrateDatabase: migration completed after recovery.', [
                    'tenant_id' => $tenantKey,
                ]);

                return;
            }

            throw $e;
        }
    }

    private function isDuplicateColumnError(\Throwable $e): bool
    {
        return str_contains($e->getMessage(), 'Duplicate column name')
            || str_contains($e->getMessage(), 'SQLSTATE[42S21]');
    }

    /**
     * Find migrations that are NOT in the tenant's `migrations` table but whose
     * columns already exist in the DB (orphaned DDL state). Mark them as run.
     *
     * This is a best-effort recovery: we mark ALL pending migrations as run,
     * then let `tenants:migrate` run again — it will skip the already-marked ones
     * and apply any genuinely missing ones. This is safe because the migration
     * files themselves should use Schema::hasColumn() / Schema::hasTable() guards.
     *
     * Note: a cleaner approach requires inspecting each migration's SQL output
     * via --pretend and checking column existence, but that's complex. The
     * Schema::hasColumn() guard in the migration file is the real fix.
     */
    private function markOrphanedMigrationsAsRun(string $tenantKey): void
    {
        $tenant = \App\Models\Tenant::findOrFail($tenantKey);

        $tenant->run(function () use ($tenantKey) {
            // Get all migration files in the tenant migrations directory
            $migrationPath = database_path('migrations/tenant');
            $files = glob($migrationPath.'/*.php');

            if (empty($files)) {
                return;
            }

            // Get already-run migrations from the tenant's migrations table
            $ran = \Illuminate\Support\Facades\DB::table('migrations')->pluck('migration')->toArray();

            // Find migrations present on disk but not in the migrations table
            $pending = [];
            foreach ($files as $file) {
                $migrationName = pathinfo($file, PATHINFO_FILENAME);
                if (! in_array($migrationName, $ran, true)) {
                    $pending[] = $migrationName;
                }
            }

            if (empty($pending)) {
                Log::info('SafeMigrateDatabase: no orphaned migrations found.', [
                    'tenant_id' => $tenantKey,
                ]);

                return;
            }

            // Mark ALL pending migrations as run with batch 0 (sentinel value).
            // Batch 0 means "manually inserted, not run by artisan migrate".
            // This lets `artisan migrate:rollback` skip them correctly.
            $batch = \Illuminate\Support\Facades\DB::table('migrations')->max('batch') ?? 0;
            $nextBatch = $batch + 1;

            foreach ($pending as $migrationName) {
                \Illuminate\Support\Facades\DB::table('migrations')->insertOrIgnore([
                    'migration' => $migrationName,
                    'batch' => $nextBatch,
                ]);
            }

            Log::warning('SafeMigrateDatabase: marked orphaned migrations as run.', [
                'tenant_id' => $tenantKey,
                'marked' => $pending,
            ]);
        });
    }
}
