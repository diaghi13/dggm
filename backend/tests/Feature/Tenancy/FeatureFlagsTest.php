<?php

declare(strict_types=1);

use App\Models\Landlord\Plan;
use App\Models\Landlord\TenantSubscription;
use App\Models\Tenant;
use App\Models\User;
use App\Services\FeatureService;
use Tests\Traits\CreatesTestTenant;

uses(\Tests\TestCase::class, CreatesTestTenant::class);

beforeEach(function () {
    (new \Database\Seeders\PlanSeeder)->run();

    $this->setUpTenant();
});

afterEach(function () {
    TenantSubscription::where('tenant_id', $this->tenant->id)->delete();
    $this->tearDownTenant();
});

// ─────────────────────────────────────────────
// Unit tests: FeatureService (no HTTP)
// ─────────────────────────────────────────────

it('returns features for active subscription with base plan', function () {
    $plan = Plan::where('slug', 'base')->first();

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    tenancy()->initialize($this->tenant);

    $service = app(FeatureService::class);

    expect($service->enabled('quotes'))->toBeTrue();
    expect($service->enabled('projects'))->toBeTrue();
    expect($service->enabled('warehouse'))->toBeFalse();
    expect($service->enabled('workers'))->toBeFalse();
    expect($service->enabled('rental'))->toBeFalse();

    tenancy()->end();
});

it('returns all features for full plan', function () {
    $plan = Plan::where('slug', 'full')->first();

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    tenancy()->initialize($this->tenant);

    $service = app(FeatureService::class);

    expect($service->enabled('warehouse'))->toBeTrue();
    expect($service->enabled('workers'))->toBeTrue();
    expect($service->enabled('rental'))->toBeTrue();

    tenancy()->end();
});

it('returns empty features when no active subscription', function () {
    tenancy()->initialize($this->tenant);

    $service = app(FeatureService::class);

    expect($service->enabled('quotes'))->toBeFalse();
    expect($service->enabled('warehouse'))->toBeFalse();

    tenancy()->end();
});

it('clears feature cache after calling clearCache', function () {
    $plan = Plan::where('slug', 'base')->first();

    $subscription = TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    tenancy()->initialize($this->tenant);

    $service = app(FeatureService::class);

    // Prime the cache
    expect($service->enabled('warehouse'))->toBeFalse();

    // Upgrade to full plan
    $fullPlan = Plan::where('slug', 'full')->first();
    $subscription->update(['plan_id' => $fullPlan->id]);

    // After clearing, new value is returned
    $service->clearCache($this->tenant->id);

    expect($service->enabled('warehouse'))->toBeTrue();

    tenancy()->end();
});

it('returns true for enabled() when tenancy is not initialized', function () {
    // Outside tenant context: always allow
    $service = app(FeatureService::class);
    expect($service->enabled('warehouse'))->toBeTrue();
});

// ─────────────────────────────────────────────
// HTTP tests: feature middleware on API routes
// These use auth:sanctum with a tenant User
// ─────────────────────────────────────────────

it('blocks warehouse routes for base plan tenant', function () {
    $plan = Plan::where('slug', 'base')->first();

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    // Create a local tenant user (Sanctum auth:sanctum)
    tenancy()->initialize($this->tenant);
    $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('test')->plainTextToken;
    tenancy()->end();

    $response = $this->withToken($token)
        ->withHeader('x-tenant', $this->tenant->id)
        ->getJson('/api/v1/warehouses');

    $response->assertForbidden()
        ->assertJson(['success' => false]);

    expect($response->json('message'))->toContain('piano');
});

it('allows warehouse routes for warehouse plan tenant', function () {
    $plan = Plan::where('slug', 'base-warehouse')->first();

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    // Create a local tenant user (Sanctum auth:sanctum)
    tenancy()->initialize($this->tenant);
    $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('test')->plainTextToken;
    tenancy()->end();

    $response = $this->withToken($token)
        ->withHeader('x-tenant', $this->tenant->id)
        ->getJson('/api/v1/warehouses');

    // Feature middleware should pass — response may be 200 or 403 (from Policy), never "piano" 403
    if ($response->status() === 403) {
        expect($response->json('message'))->not->toContain('piano');
    } else {
        $response->assertOk();
    }
});

it('blocks rental routes for base plan tenant', function () {
    $plan = Plan::where('slug', 'base')->first();

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    tenancy()->initialize($this->tenant);
    $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('test')->plainTextToken;
    tenancy()->end();

    $response = $this->withToken($token)
        ->withHeader('x-tenant', $this->tenant->id)
        ->getJson('/api/v1/rental-profiles');

    $response->assertForbidden()
        ->assertJson(['success' => false]);

    expect($response->json('message'))->toContain('piano');
});

it('blocks workers routes for base plan tenant', function () {
    $plan = Plan::where('slug', 'base')->first();

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    tenancy()->initialize($this->tenant);
    $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('test')->plainTextToken;
    tenancy()->end();

    $response = $this->withToken($token)
        ->withHeader('x-tenant', $this->tenant->id)
        ->getJson('/api/v1/workers');

    $response->assertForbidden()
        ->assertJson(['success' => false]);

    expect($response->json('message'))->toContain('piano');
});
