<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Tenant;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Spatie\DbDumper\Compressors\GzipCompressor;
use Spatie\DbDumper\Databases\MySql;

/**
 * Creates a safety backup of the tenant's database right before it is dropped.
 * Registered on the DeletingTenant event in TenancyServiceProvider.
 */
class BackupTenantBeforeDeletionJob
{
    public function __construct(public readonly Tenant $tenant) {}

    public function handle(): void
    {
        $dbName = config('tenancy.database.prefix').$this->tenant->id.config('tenancy.database.suffix', '');
        $slug = $this->tenant->slug ?? $this->tenant->id;
        $filename = "tenant_{$slug}_pre_deletion_".now()->format('Y-m-d_H-i-s').'.sql.gz';
        $relativePath = "tenants/pre-deletion/{$filename}";
        $absolutePath = storage_path("app/backups/{$relativePath}");

        File::ensureDirectoryExists(dirname($absolutePath));

        try {
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

            $this->uploadToRemoteDisks($relativePath, $absolutePath);

            Log::info("Pre-deletion backup created for tenant [{$this->tenant->id}]", [
                'tenant_id' => $this->tenant->id,
                'tenant_slug' => $slug,
                'file' => $relativePath,
                'size_bytes' => File::size($absolutePath),
            ]);
        } catch (\Throwable $e) {
            // Log the error but do NOT rethrow — deletion must not be blocked by a backup failure.
            Log::error("Pre-deletion backup failed for tenant [{$this->tenant->id}]: {$e->getMessage()}", [
                'tenant_id' => $this->tenant->id,
                'exception' => $e,
            ]);
        }
    }

    private function uploadToRemoteDisks(string $relativePath, string $absolutePath): void
    {
        foreach (['sftp_backup', 'b2'] as $disk) {
            $isConfigured = match ($disk) {
                'sftp_backup' => (bool) config('filesystems.disks.sftp_backup.host'),
                'b2' => (bool) config('filesystems.disks.b2.key'),
                default => false,
            };

            if (! $isConfigured) {
                continue;
            }

            try {
                $stream = fopen($absolutePath, 'r');
                Storage::disk($disk)->writeStream($relativePath, $stream);

                if (is_resource($stream)) {
                    fclose($stream);
                }
            } catch (\Throwable $e) {
                Log::warning("Pre-deletion backup: could not upload to [{$disk}]: {$e->getMessage()}", [
                    'tenant_id' => $this->tenant->id,
                ]);
            }
        }
    }
}
