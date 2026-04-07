<?php

declare(strict_types=1);

namespace App\Queries\Landlord;

use App\Models\Landlord\TenantSubscription;
use App\Models\Tenant;
use App\Queries\Backup\GetBackupStatusQuery;
use FilesystemIterator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\FileAttributes;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class GetTenantMonitoringQuery
{
    public function execute(): array
    {
        $tenants = Tenant::all();
        $dbSizes = $this->getDatabaseSizes();
        $backupStatus = app(GetBackupStatusQuery::class)->execute();
        $backupByTenant = collect($backupStatus['tenants']['per_tenant'])->keyBy('tenant_id');
        $subscriptions = TenantSubscription::with('plan')->get()->keyBy('tenant_id');

        $tenantMonitoring = $tenants->map(fn (Tenant $tenant) => $this->buildTenantData(
            $tenant,
            $dbSizes,
            $backupByTenant,
            $subscriptions,
        ))->values();

        return [
            'summary' => [
                'total_tenants' => $tenants->count(),
                'active_tenants' => $tenantMonitoring->filter(fn ($t) => $t['subscription']['status'] === 'active')->count(),
                'total_db_size_mb' => round($tenantMonitoring->sum('db.size_mb'), 2),
                'total_storage_size_mb' => round($tenantMonitoring->sum('storage.size_mb'), 2),
                'alerts_count' => $tenantMonitoring->filter(fn ($t) => $t['health'] !== 'healthy')->count(),
                'healthy_count' => $tenantMonitoring->filter(fn ($t) => $t['health'] === 'healthy')->count(),
            ],
            'system' => $this->getSystemInfo(),
            'tenants' => $tenantMonitoring,
            'backup_summary' => $backupStatus['tenants']['summary'],
        ];
    }

    private function buildTenantData(
        Tenant $tenant,
        array $dbSizes,
        Collection $backupByTenant,
        Collection $subscriptions,
    ): array {
        $prefix = config('tenancy.database.prefix', 'erp_tenant_');
        $dbKey = $prefix.$tenant->id;
        $db = $dbSizes[$dbKey] ?? null;
        $backup = $backupByTenant[$tenant->id] ?? null;
        $subscription = $subscriptions[$tenant->id] ?? null;
        $alerts = $this->buildAlerts($tenant, $backup, $subscription);

        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'created_at' => $tenant->created_at?->toIsoString(),
            'bootstrap_status' => $tenant->bootstrap_status,
            'db' => [
                'size_mb' => (float) ($db?->size_mb ?? 0),
                'table_count' => (int) ($db?->table_count ?? 0),
                'db_name' => $dbKey,
            ],
            'storage' => [
                'size_mb' => round($this->getTenantStorageSize($tenant->id), 2),
            ],
            'backup' => $backup ? [
                'status' => $backup['status'],
                'last_backup_at' => $backup['last_backup_at'],
                'backup_count' => $backup['backup_count'],
                'total_size_mb' => round($backup['total_size_mb'], 2),
            ] : [
                'status' => 'missing',
                'last_backup_at' => null,
                'backup_count' => 0,
                'total_size_mb' => 0,
            ],
            'subscription' => [
                'status' => $subscription?->status ?? 'none',
                'plan_name' => $subscription?->plan?->name,
                'billing_cycle' => $subscription?->billing_cycle,
                'renews_at' => $subscription?->renews_at?->toIsoString(),
                'ends_at' => $subscription?->ends_at?->toIsoString(),
                'trial_ends_at' => $subscription?->trial_ends_at?->toIsoString(),
            ],
            'health' => $this->calculateHealth($alerts),
            'alerts' => $alerts,
        ];
    }

    private function buildAlerts(Tenant $tenant, ?array $backup, ?TenantSubscription $subscription): array
    {
        $alerts = [];

        if ($tenant->bootstrap_status === 'failed') {
            $alerts[] = ['type' => 'bootstrap_failed', 'severity' => 'critical', 'message' => 'Inizializzazione tenant fallita'];
        }

        if (! $backup || $backup['status'] === 'missing') {
            $alerts[] = ['type' => 'no_backup', 'severity' => 'warning', 'message' => 'Nessun backup disponibile'];
        } elseif ($backup['status'] === 'warning') {
            $hours = Carbon::parse($backup['last_backup_at'])->diffInHours(now());
            $alerts[] = ['type' => 'backup_warning', 'severity' => 'warning', 'message' => "Backup non recente ({$hours}h fa)"];
        }

        if ($subscription) {
            if ($subscription->status === 'suspended') {
                $alerts[] = ['type' => 'suspended', 'severity' => 'warning', 'message' => 'Abbonamento sospeso'];
            }

            if ($subscription->ends_at?->isFuture() && now()->diffInDays($subscription->ends_at) <= 7) {
                $days = (int) now()->diffInDays($subscription->ends_at);
                $alerts[] = ['type' => 'expiring_soon', 'severity' => 'warning', 'message' => "Scade tra {$days} giorni"];
            }

            if ($subscription->ends_at?->isPast() && $subscription->status === 'active') {
                $alerts[] = ['type' => 'expired', 'severity' => 'critical', 'message' => 'Abbonamento scaduto'];
            }

            if ($subscription->trial_ends_at?->isFuture() && now()->diffInDays($subscription->trial_ends_at) <= 3) {
                $days = (int) now()->diffInDays($subscription->trial_ends_at);
                $alerts[] = ['type' => 'trial_expiring', 'severity' => 'warning', 'message' => "Trial scade tra {$days} giorni"];
            }
        }

        return $alerts;
    }

    private function calculateHealth(array $alerts): string
    {
        if (empty($alerts)) {
            return 'healthy';
        }

        foreach ($alerts as $alert) {
            if ($alert['severity'] === 'critical') {
                return 'critical';
            }
        }

        return 'warning';
    }

    private function getDatabaseSizes(): array
    {
        $prefix = config('tenancy.database.prefix', 'erp_tenant_');

        $results = DB::select(
            'SELECT
                table_schema AS db_name,
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb,
                COUNT(*) AS table_count
             FROM information_schema.TABLES
             WHERE table_schema LIKE ?
             GROUP BY table_schema',
            [$prefix.'%']
        );

        return collect($results)->keyBy('db_name')->all();
    }

    private function getTenantStorageSize(string $tenantId): float
    {
        return $this->isS3Driver()
            ? $this->getS3TenantStorageSize($tenantId)
            : $this->getLocalTenantStorageSize($tenantId);
    }

    private function getLocalTenantStorageSize(string $tenantId): float
    {
        $path = base_path('storage/erp_tenant_'.$tenantId);

        if (! is_dir($path)) {
            return 0.0;
        }

        $size = 0;

        try {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
            );

            foreach ($iterator as $file) {
                if ($file->isFile()) {
                    $size += $file->getSize();
                }
            }
        } catch (\Throwable) {
            return 0.0;
        }

        return $size / 1024 / 1024;
    }

    private function getS3TenantStorageSize(string $tenantId): float
    {
        $suffixBase = config('tenancy.filesystem.suffix_base', 'erp_tenant_');
        $prefix = $suffixBase.$tenantId.'/';
        $size = 0;

        try {
            $contents = Storage::disk('s3')->listContents($prefix, recursive: true);

            foreach ($contents as $item) {
                if ($item instanceof FileAttributes) {
                    $size += $item->fileSize() ?? 0;
                }
            }
        } catch (\Throwable) {
            return 0.0;
        }

        return $size / 1024 / 1024;
    }

    /**
     * Determina se il driver tenant primario è S3.
     * Basta che 's3' sia presente nell'elenco dei dischi tenancy.
     */
    private function isS3Driver(): bool
    {
        $tenancyDisks = config('tenancy.filesystem.disks', ['local', 'public']);

        return in_array('s3', $tenancyDisks, strict: true)
            && config('filesystems.disks.s3.driver') === 's3';
    }

    private function getSystemInfo(): array
    {
        $path = base_path('storage');
        $total = disk_total_space($path);
        $free = disk_free_space($path);
        $used = $total - $free;

        return [
            'driver' => $this->isS3Driver() ? 's3' : 'local',
            'disk_total_gb' => round($total / 1024 / 1024 / 1024, 2),
            'disk_free_gb' => round($free / 1024 / 1024 / 1024, 2),
            'disk_used_gb' => round($used / 1024 / 1024 / 1024, 2),
            'disk_used_percent' => round(($used / $total) * 100, 1),
        ];
    }
}
