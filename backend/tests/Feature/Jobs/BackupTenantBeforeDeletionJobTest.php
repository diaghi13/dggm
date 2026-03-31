<?php

declare(strict_types=1);

use App\Jobs\BackupTenantBeforeDeletionJob;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local_backups');
});

describe('BackupTenantBeforeDeletionJob', function () {
    it('logs an error and does not throw when the database dump fails', function () {
        Log::spy();

        $tenant = Tenant::create([
            'id' => 'aaaaaaaa-0000-0000-0000-000000000099',
            'slug' => 'doomed-tenant',
            'name' => 'Doomed',
        ]);

        // Point to a non-existent database host to force a dump failure.
        config(['database.connections.mysql.host' => '999.999.999.999']);

        $job = new BackupTenantBeforeDeletionJob($tenant);

        // Should NOT throw — errors are caught internally and logged.
        expect(fn () => $job->handle())->not->toThrow(\Throwable::class);

        Log::shouldHaveReceived('error')->once();
    });

    it('can be instantiated with a tenant and exposes the tenant property', function () {
        $tenant = Tenant::create([
            'id' => 'aaaaaaaa-0000-0000-0000-000000000088',
            'slug' => 'test-tenant',
            'name' => 'Test',
        ]);

        $job = new BackupTenantBeforeDeletionJob($tenant);

        expect($job->tenant->id)->toBe($tenant->id);
        expect($job->tenant->slug)->toBe('test-tenant');
    });

    it('is registered on the DeletingTenant event in TenancyServiceProvider', function () {
        $provider = new \App\Providers\TenancyServiceProvider(app());
        $events = $provider->events();

        expect(array_key_exists(\Stancl\Tenancy\Events\DeletingTenant::class, $events))->toBeTrue();

        $listeners = $events[\Stancl\Tenancy\Events\DeletingTenant::class] ?? [];
        expect($listeners)->not->toBeEmpty();
    });

    it('includes BackupTenantBeforeDeletionJob in the DeletingTenant pipeline', function () {
        $provider = new \App\Providers\TenancyServiceProvider(app());
        $events = $provider->events();
        $listeners = $events[\Stancl\Tenancy\Events\DeletingTenant::class] ?? [];

        // Extract job class names from any JobPipeline listeners
        $foundInPipeline = collect($listeners)->contains(function ($listener) {
            if (! ($listener instanceof \Stancl\JobPipeline\JobPipeline)) {
                return false;
            }

            // Access the jobs property via reflection — JobPipeline stores jobs internally
            $reflection = new ReflectionClass($listener);

            if (! $reflection->hasProperty('jobs')) {
                return false;
            }

            $jobsProp = $reflection->getProperty('jobs');
            $jobsProp->setAccessible(true);
            $jobs = $jobsProp->getValue($listener);

            return in_array(\App\Jobs\BackupTenantBeforeDeletionJob::class, (array) $jobs, true);
        });

        expect($foundInPipeline)->toBeTrue();
    });
});
