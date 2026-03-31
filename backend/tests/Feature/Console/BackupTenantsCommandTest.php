<?php

declare(strict_types=1);

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

// Note: backup:tenants --list reads from storage_path('app/backups/tenants') via File::,
// not from a Storage disk, so Storage::fake() cannot intercept it. These tests verify
// the command's behaviour purely through DB state and output assertions.

describe('backup:tenants --list', function () {
    it('exits with code 0 whether or not backup files exist on disk', function () {
        // The --list command reads from storage_path('app/backups/tenants') via File::,
        // so we cannot control its output with Storage::fake(). We only assert the exit code.
        $this->artisan('backup:tenants --list')
            ->assertExitCode(0);
    });
});

describe('backup:tenants (no tenants)', function () {
    it('exits successfully when no tenants exist', function () {
        $this->artisan('backup:tenants')
            ->expectsOutput('No tenants found.')
            ->assertExitCode(0);
    });
});

describe('backup:tenants --tenant=invalid', function () {
    it('exits successfully when the given tenant slug does not match any record', function () {
        $this->artisan('backup:tenants --tenant=nonexistent-slug')
            ->expectsOutput('No tenants found.')
            ->assertExitCode(0);
    });
});

describe('backup:tenants with tenant filter', function () {
    it('matches a tenant by slug and attempts a dump for that tenant only', function () {
        Tenant::create(['id' => 'aaaaaaaa-0000-0000-0000-000000000002', 'slug' => 'acme', 'name' => 'Acme']);
        Tenant::create(['id' => 'bbbbbbbb-0000-0000-0000-000000000002', 'slug' => 'beta', 'name' => 'Beta']);

        // The actual mysqldump will fail in the test environment (no real tenant DB),
        // so we expect a failure exit code but also expect the tenant slug to appear
        // in the output, proving the correct tenant was resolved.
        $this->artisan('backup:tenants --tenant=acme')
            ->expectsOutputToContain('[acme]')
            ->assertExitCode(1); // 1 = Command::FAILURE (dump failed, expected)
    });
});
