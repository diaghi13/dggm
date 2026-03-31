<?php

declare(strict_types=1);

namespace App\Queries\Backup;

use App\Models\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class GetBackupStatusQuery
{
    public function execute(): array
    {
        return [
            'central' => $this->getCentralStatus(),
            'tenants' => $this->getTenantsStatus(),
        ];
    }

    private function getCentralStatus(): array
    {
        $appName = config('app.name', 'laravel-backup');

        $files = collect(Storage::disk('local_backups')->files($appName))
            ->map(fn ($file) => $this->mapBackupFile($file))
            ->sortByDesc('created_at')
            ->values();

        $latest = $files->first();
        $ageHours = $latest ? Carbon::parse($latest['created_at'])->diffInHours(now()) : null;

        $status = match (true) {
            $latest === null => 'no_backup',
            $ageHours <= 26 => 'healthy',
            $ageHours <= 72 => 'warning',
            default => 'critical',
        };

        return [
            'status' => $status,
            'backup_count' => $files->count(),
            'last_backup_at' => $latest['created_at'] ?? null,
            'total_size_mb' => $files->sum('size_bytes') / 1024 / 1024,
            'backups' => $files,
        ];
    }

    private function getTenantsStatus(): array
    {
        $tenants = Tenant::all();

        $perTenant = $tenants->map(function (Tenant $tenant) {
            $slug = $tenant->slug ?? $tenant->id;
            $files = collect(Storage::disk('local_backups')->files("tenants/{$tenant->id}"))
                ->map(fn ($file) => $this->mapBackupFile($file))
                ->sortByDesc('created_at')
                ->values();

            $latest = $files->first();
            $ageHours = $latest ? Carbon::parse($latest['created_at'])->diffInHours(now()) : null;

            return [
                'tenant_id' => $tenant->id,
                'tenant_slug' => $slug,
                'tenant_name' => $tenant->name ?? $slug,
                'backup_count' => $files->count(),
                'last_backup_at' => $latest['created_at'] ?? null,
                'total_size_mb' => $files->sum('size_bytes') / 1024 / 1024,
                'status' => match (true) {
                    $latest === null => 'missing',
                    $ageHours <= 26 => 'healthy',
                    default => 'warning',
                },
            ];
        })->values();

        $preDeletionCount = count(Storage::disk('local_backups')->files('tenants/pre-deletion'));

        return [
            'summary' => [
                'total_tenants' => $tenants->count(),
                'tenants_with_backup' => $perTenant->where('backup_count', '>', 0)->count(),
                'tenants_missing' => $perTenant->where('status', 'missing')->count(),
                'last_backup_at' => $perTenant->whereNotNull('last_backup_at')->max('last_backup_at'),
                'total_size_mb' => $perTenant->sum('total_size_mb'),
            ],
            'pre_deletion_count' => $preDeletionCount,
            'per_tenant' => $perTenant,
        ];
    }

    private function mapBackupFile(string $filePath): array
    {
        $size = Storage::disk('local_backups')->size($filePath);
        $lastModified = Storage::disk('local_backups')->lastModified($filePath);

        return [
            'filename' => basename($filePath),
            'path' => $filePath,
            'size_bytes' => $size,
            'size_mb' => $size / 1024 / 1024,
            'created_at' => Carbon::createFromTimestamp($lastModified)->toDateTimeString(),
        ];
    }
}
