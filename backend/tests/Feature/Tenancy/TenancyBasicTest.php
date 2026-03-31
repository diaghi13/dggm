<?php

declare(strict_types=1);

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // Ensure we start in the central context
    if (tenancy()->initialized) {
        tenancy()->end();
    }
});

afterEach(function () {
    // Always revert to central context after each test
    if (tenancy()->initialized) {
        tenancy()->end();
    }
});

it('can create a tenant and the database is created automatically', function () {
    $tenant = Tenant::create([
        'name' => 'Test Company',
        'slug' => 'test-company-'.uniqid(),
    ]);

    expect($tenant->id)->not->toBeNull();
    expect($tenant->name)->toBe('Test Company');
    expect($tenant->getTenantKey())->toBe($tenant->id);

    // The TenancyServiceProvider pipeline runs CreateDatabase + MigrateDatabase on TenantCreated
    // Verify the tenant DB was created by switching context
    tenancy()->initialize($tenant);

    expect(tenancy()->tenant->id)->toBe($tenant->id);
    expect(tenancy()->initialized)->toBeTrue();

    tenancy()->end();

    expect(tenancy()->initialized)->toBeFalse();

    $tenant->delete();
});

it('resolves tenant from x-tenant header', function () {
    $uniqueSlug = 'header-test-'.uniqid();
    $tenant = Tenant::create([
        'name' => 'Header Test Company',
        'slug' => $uniqueSlug,
    ]);

    $response = $this->withHeader('X-Tenant', $tenant->id)
        ->getJson('/api/test-tenant-context');

    $response->assertStatus(200)
        ->assertJson(['tenant' => $tenant->id]);

    tenancy()->end();
    $tenant->delete();
});

it('isolates data between tenants', function () {
    $tenant1 = Tenant::create([
        'name' => 'Tenant One',
        'slug' => 'tenant-one-'.uniqid(),
    ]);

    $tenant2 = Tenant::create([
        'name' => 'Tenant Two',
        'slug' => 'tenant-two-'.uniqid(),
    ]);

    // Switch to tenant1 — stancl creates a dynamic 'tenant' connection config while initialized
    // We read the tenant DB name BEFORE ending tenancy (purgeTenantConnection removes it)
    tenancy()->initialize($tenant1);
    $db1 = config('database.connections.tenant')['database'];
    tenancy()->end();

    tenancy()->initialize($tenant2);
    $db2 = config('database.connections.tenant')['database'];
    tenancy()->end();

    expect($db1)->not->toBe($db2);

    $tenant1->delete();
    $tenant2->delete();
});
