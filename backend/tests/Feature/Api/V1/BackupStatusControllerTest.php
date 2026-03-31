<?php

declare(strict_types=1);

use App\Models\Landlord\GlobalUser;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local_backups');

    $this->admin = GlobalUser::firstOrCreate(
        ['email' => 'admin-backup-test@example.com'],
        [
            'name' => 'Landlord Admin',
            'password' => 'password',
            'is_landlord_admin' => true,
        ]
    );
});

afterEach(function () {
    GlobalUser::where('email', 'admin-backup-test@example.com')->forceDelete();
});

describe('GET /api/v1/landlord/backup/status', function () {
    it('returns 401 for unauthenticated requests', function () {
        $this->getJson('/api/v1/landlord/backup/status')
            ->assertUnauthorized();
    });

    it('returns backup status with empty backup directory', function () {
        $response = $this->actingAs($this->admin, 'global')
            ->getJson('/api/v1/landlord/backup/status');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'central' => ['status', 'backup_count', 'last_backup_at', 'total_size_mb', 'backups'],
                    'tenants' => [
                        'summary' => ['total_tenants', 'tenants_with_backup', 'tenants_missing', 'last_backup_at', 'total_size_mb'],
                        'pre_deletion_count',
                        'per_tenant',
                    ],
                ],
            ]);

        expect($response->json('data.central.status'))->toBe('no_backup');
        expect($response->json('data.central.backup_count'))->toBe(0);
        expect($response->json('data.tenants.per_tenant'))->toBeArray();
    });

    it('detects central backup files', function () {
        $appName = config('app.name');

        // Simulate a backup file created by spatie/laravel-backup
        Storage::disk('local_backups')->put(
            "{$appName}/central_2026-03-31-02-00-00.zip",
            str_repeat('x', 1024) // 1 KB fake content
        );

        $response = $this->actingAs($this->admin, 'global')
            ->getJson('/api/v1/landlord/backup/status');

        $response->assertOk();
        expect($response->json('data.central.backup_count'))->toBe(1);
        expect($response->json('data.central.backups'))->toHaveCount(1);
        expect($response->json('data.central.backups.0.filename'))->toBe('central_2026-03-31-02-00-00.zip');
    });

    it('detects tenant backup files', function () {
        $tenant = Tenant::create(['id' => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'slug' => 'acme', 'name' => 'Acme Srl']);

        Storage::disk('local_backups')->put(
            "tenants/{$tenant->id}/tenant_acme_2026-03-31_03-00-00.sql.gz",
            'fake sql content'
        );

        $response = $this->actingAs($this->admin, 'global')
            ->getJson('/api/v1/landlord/backup/status');

        $response->assertOk();

        $perTenant = collect($response->json('data.tenants.per_tenant'));
        $tenantRow = $perTenant->firstWhere('tenant_id', $tenant->id);

        expect($tenantRow)->not->toBeNull();
        expect($tenantRow['backup_count'])->toBe(1);
        expect($tenantRow['tenant_slug'])->toBe('acme');
    });

    it('counts pre-deletion backups', function () {
        Storage::disk('local_backups')->put('tenants/pre-deletion/tenant_acme_pre_deletion.sql.gz', 'data');
        Storage::disk('local_backups')->put('tenants/pre-deletion/tenant_beta_pre_deletion.sql.gz', 'data');

        $response = $this->actingAs($this->admin, 'global')
            ->getJson('/api/v1/landlord/backup/status');

        $response->assertOk();
        expect($response->json('data.tenants.pre_deletion_count'))->toBe(2);
    });
});

describe('POST /api/v1/landlord/backup/run', function () {
    it('returns 401 for unauthenticated requests', function () {
        $this->postJson('/api/v1/landlord/backup/run', ['type' => 'all'])
            ->assertUnauthorized();
    });

    it('dispatches backup job for valid type', function () {
        Queue::fake();

        $response = $this->actingAs($this->admin, 'global')
            ->postJson('/api/v1/landlord/backup/run', ['type' => 'all']);

        $response->assertStatus(202)
            ->assertJson(['success' => true]);

        Queue::assertPushed(\App\Jobs\RunBackupJob::class, function ($job) {
            return $job->type === 'all';
        });
    });

    it('dispatches central-only backup', function () {
        Queue::fake();

        $this->actingAs($this->admin, 'global')
            ->postJson('/api/v1/landlord/backup/run', ['type' => 'central'])
            ->assertStatus(202);

        Queue::assertPushed(\App\Jobs\RunBackupJob::class, function ($job) {
            return $job->type === 'central';
        });
    });

    it('rejects invalid backup type', function () {
        $this->actingAs($this->admin, 'global')
            ->postJson('/api/v1/landlord/backup/run', ['type' => 'invalid'])
            ->assertStatus(422);
    });
});
