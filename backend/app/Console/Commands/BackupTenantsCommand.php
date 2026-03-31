<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Spatie\DbDumper\Compressors\GzipCompressor;
use Spatie\DbDumper\Databases\MySql;

class BackupTenantsCommand extends Command
{
    protected $signature = 'backup:tenants
                            {--tenant= : ID or slug of a specific tenant to backup}
                            {--list    : List existing tenant backups without creating new ones}';

    protected $description = 'Backup all tenant databases (or a specific tenant)';

    public function handle(): int
    {
        if ($this->option('list')) {
            return $this->listBackups();
        }

        $tenants = $this->resolveTenants();

        if ($tenants->isEmpty()) {
            $this->info('No tenants found.');

            return Command::SUCCESS;
        }

        $this->info("Backing up {$tenants->count()} tenant(s)...");

        $failed = 0;

        foreach ($tenants as $tenant) {
            $slug = $tenant->slug ?? $tenant->id;
            $this->line("  → [{$slug}]");

            try {
                $path = $this->dumpTenant($tenant);
                $this->uploadToRemoteDisks($path);
                $this->info("    ✓ Saved: {$path}");
            } catch (\Throwable $e) {
                $this->error("    ✗ Failed: {$e->getMessage()}");
                $failed++;
            }
        }

        if ($failed > 0) {
            $this->error("{$failed} backup(s) failed.");

            return Command::FAILURE;
        }

        $this->info('All tenant backups completed successfully.');

        return Command::SUCCESS;
    }

    protected function resolveTenants()
    {
        $tenantOption = $this->option('tenant');

        if (! $tenantOption) {
            return Tenant::all();
        }

        return Tenant::query()
            ->where('id', $tenantOption)
            ->orWhere('slug', $tenantOption)
            ->get();
    }

    private function dumpTenant(Tenant $tenant): string
    {
        $dbName = config('tenancy.database.prefix').$tenant->id.config('tenancy.database.suffix', '');
        $slug = $tenant->slug ?? $tenant->id;
        $filename = "tenant_{$slug}_".now()->format('Y-m-d_H-i-s').'.sql.gz';
        $relativePath = "tenants/{$tenant->id}/{$filename}";
        $absolutePath = storage_path("app/backups/{$relativePath}");

        File::ensureDirectoryExists(dirname($absolutePath));

        $dumper = MySql::create()
            ->setHost(config('database.connections.mysql.host', '127.0.0.1'))
            ->setPort((int) config('database.connections.mysql.port', 3306))
            ->setDbName($dbName)
            ->setUserName(config('database.connections.mysql.username'))
            ->setPassword(config('database.connections.mysql.password', ''))
            ->useCompressor(new GzipCompressor);

        $binaryPath = config('database.connections.mysql.dump.dump_binary_path', '');

        if ($binaryPath !== '') {
            $dumper->setDumpBinaryPath($binaryPath);
        }

        $dumper->dumpToFile($absolutePath);

        return $relativePath;
    }

    private function uploadToRemoteDisks(string $relativePath): void
    {
        $absolutePath = storage_path("app/backups/{$relativePath}");

        if (config('filesystems.disks.sftp_backup.host')) {
            $this->uploadToDisk('sftp_backup', $relativePath, $absolutePath);
        }

        if (config('filesystems.disks.b2.key')) {
            $this->uploadToDisk('b2', $relativePath, $absolutePath);
        }
    }

    private function uploadToDisk(string $disk, string $remotePath, string $localPath): void
    {
        try {
            $stream = fopen($localPath, 'r');
            Storage::disk($disk)->writeStream($remotePath, $stream);

            if (is_resource($stream)) {
                fclose($stream);
            }

            $this->line("    ↑ Uploaded to [{$disk}]");
        } catch (\Throwable $e) {
            $this->warn("    ! Could not upload to [{$disk}]: {$e->getMessage()}");
        }
    }

    private function listBackups(): int
    {
        $backupsRoot = storage_path('app/backups/tenants');

        if (! File::isDirectory($backupsRoot)) {
            $this->info('No tenant backups found.');

            return Command::SUCCESS;
        }

        $tenantOption = $this->option('tenant');
        $rows = [];

        foreach (File::directories($backupsRoot) as $tenantDir) {
            $tenantId = basename($tenantDir);

            if ($tenantOption && $tenantId !== $tenantOption) {
                $tenant = Tenant::query()
                    ->where('slug', $tenantOption)
                    ->first();

                if (! $tenant || $tenant->id !== $tenantId) {
                    continue;
                }
            }

            $tenant = Tenant::find($tenantId);
            $slug = $tenant?->slug ?? $tenantId;

            foreach (File::files($tenantDir) as $file) {
                $rows[] = [
                    $slug,
                    $file->getFilename(),
                    number_format($file->getSize() / 1024 / 1024, 2).' MB',
                    date('Y-m-d H:i:s', $file->getMTime()),
                ];
            }
        }

        if (empty($rows)) {
            $this->info('No tenant backups found.');

            return Command::SUCCESS;
        }

        $this->table(['Tenant', 'File', 'Size', 'Date'], $rows);

        return Command::SUCCESS;
    }
}
