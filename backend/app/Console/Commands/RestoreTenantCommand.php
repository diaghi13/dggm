<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

class RestoreTenantCommand extends Command
{
    protected $signature = 'backup:restore-tenant
                            {tenant  : Tenant ID or slug}
                            {file?   : Backup filename or full path (omit to choose interactively)}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Restore a tenant database from a backup file';

    public function handle(): int
    {
        $tenant = $this->resolveTenant();

        if (! $tenant) {
            $this->error('Tenant not found.');

            return Command::FAILURE;
        }

        $slug = $tenant->slug ?? $tenant->id;
        $backupPath = $this->resolveBackupFile($tenant);

        if (! $backupPath) {
            return Command::FAILURE;
        }

        $dbName = config('tenancy.database.prefix').$tenant->id.config('tenancy.database.suffix', '');

        $this->warn("⚠  You are about to OVERWRITE the database [{$dbName}] for tenant [{$slug}].");
        $this->line("   Backup file: {$backupPath}");

        if (! $this->option('force') && ! $this->confirm('Are you sure you want to proceed?')) {
            $this->info('Restore cancelled.');

            return Command::SUCCESS;
        }

        $this->info("Restoring [{$slug}] from backup...");

        try {
            $this->runRestore($dbName, $backupPath);
            $this->info("✓ Tenant [{$slug}] restored successfully.");

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("✗ Restore failed: {$e->getMessage()}");

            return Command::FAILURE;
        }
    }

    private function resolveTenant(): ?Tenant
    {
        $identifier = $this->argument('tenant');

        return Tenant::query()
            ->where('id', $identifier)
            ->orWhere('slug', $identifier)
            ->first();
    }

    private function resolveBackupFile(Tenant $tenant): ?string
    {
        $fileArgument = $this->argument('file');

        // Full path provided directly.
        if ($fileArgument && File::isFile($fileArgument)) {
            return $fileArgument;
        }

        // Filename relative to the tenant backup directory.
        $backupDir = storage_path("app/backups/tenants/{$tenant->id}");

        if ($fileArgument) {
            $candidatePath = "{$backupDir}/{$fileArgument}";

            if (File::isFile($candidatePath)) {
                return $candidatePath;
            }

            $this->error("Backup file not found: {$fileArgument}");

            return null;
        }

        // No file argument — let user pick interactively.
        if (! File::isDirectory($backupDir)) {
            $this->error('No backups found for this tenant.');

            return null;
        }

        $files = collect(File::files($backupDir))
            ->sortByDesc(fn ($f) => $f->getMTime())
            ->values();

        if ($files->isEmpty()) {
            $this->error("No backup files found in: {$backupDir}");

            return null;
        }

        $choices = $files->map(fn ($f) => sprintf(
            '%s  (%s MB — %s)',
            $f->getFilename(),
            number_format($f->getSize() / 1024 / 1024, 2),
            date('Y-m-d H:i:s', $f->getMTime())
        ))->all();

        $selected = $this->choice('Select a backup to restore:', $choices, 0);
        $index = array_search($selected, $choices);

        return $files[$index]->getPathname();
    }

    private function runRestore(string $dbName, string $backupPath): void
    {
        $host = config('database.connections.mysql.host', '127.0.0.1');
        $port = (int) config('database.connections.mysql.port', 3306);
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password', '');

        $isGzip = str_ends_with($backupPath, '.gz');

        if ($isGzip) {
            // gunzip piped to mysql
            $command = array_filter([
                'bash', '-c',
                sprintf(
                    'gunzip -c %s | mysql -h%s -P%d -u%s %s %s',
                    escapeshellarg($backupPath),
                    escapeshellarg($host),
                    $port,
                    escapeshellarg($username),
                    $password ? '-p'.escapeshellarg($password) : '',
                    escapeshellarg($dbName)
                ),
            ]);
        } else {
            $command = array_filter([
                'mysql',
                "-h{$host}",
                "-P{$port}",
                "-u{$username}",
                $password ? "-p{$password}" : null,
                $dbName,
                '<',
                $backupPath,
            ]);
        }

        // Use bash -c for piped commands (gzip case).
        $process = $isGzip
            ? Process::fromShellCommandline(sprintf(
                'gunzip -c %s | mysql -h%s -P%d -u%s %s %s',
                escapeshellarg($backupPath),
                escapeshellarg($host),
                $port,
                escapeshellarg($username),
                $password ? sprintf('-p%s', $password) : '',
                escapeshellarg($dbName)
            ))
            : Process::fromShellCommandline(sprintf(
                'mysql -h%s -P%d -u%s %s %s < %s',
                escapeshellarg($host),
                $port,
                escapeshellarg($username),
                $password ? sprintf('-p%s', $password) : '',
                escapeshellarg($dbName),
                escapeshellarg($backupPath)
            ));

        $process->setTimeout(3600);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException($process->getErrorOutput() ?: 'mysql restore process failed.');
        }
    }
}
