<?php

declare(strict_types=1);

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\Plan;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use Tests\TestCase;
use Tests\Traits\CreatesTestTenant;

uses(TestCase::class, CreatesTestTenant::class);

beforeEach(function () {
    // Use a unique email per test run to avoid cross-test conflicts in MySQL
    $uniqueEmail = 'authtest-'.uniqid().'@example.com';
    $this->testEmail = $uniqueEmail;

    $this->globalUser = GlobalUser::create([
        'name' => 'Test User',
        'email' => $uniqueEmail,
        'password' => 'password',
    ]);

    // Ensure a base plan exists (may be wiped by RefreshDatabase in sibling tests)
    $this->basePlan = Plan::firstOrCreate(
        ['slug' => 'base'],
        ['name' => 'Base', 'is_active' => true]
    );
});

afterEach(function () {
    if (isset($this->globalUser)) {
        $this->globalUser->tokens()->delete();
        $this->globalUser->forceDelete();
    }
});

it('can login with valid credentials and receive token and tenant list', function () {
    $response = $this->postJson('/api/v1/auth/global/login', [
        'email' => $this->testEmail,
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => ['token', 'user' => ['id', 'name', 'email'], 'tenants'],
        ])
        ->assertJson(['success' => true]);

    expect($response->json('data.token'))->not->toBeNull();
});

it('returns 422 with invalid credentials', function () {
    $response = $this->postJson('/api/v1/auth/global/login', [
        'email' => $this->testEmail,
        'password' => 'wrong-password',
    ]);

    $response->assertUnprocessable();
});

it('returns 422 when email not found', function () {
    $response = $this->postJson('/api/v1/auth/global/login', [
        'email' => 'nonexistent@example.com',
        'password' => 'password',
    ]);

    $response->assertUnprocessable();
});

it('can get authenticated global user info', function () {
    $token = $this->globalUser->createToken('test')->plainTextToken;

    $response = $this->withToken($token)
        ->getJson('/api/v1/auth/global/me');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => ['user' => ['email' => $this->testEmail]],
        ]);
});

it('returns 401 on global me without token', function () {
    $this->getJson('/api/v1/auth/global/me')
        ->assertUnauthorized();
});

it('can logout and invalidate token', function () {
    $token = $this->globalUser->createToken('test')->plainTextToken;

    $this->withToken($token)->postJson('/api/v1/auth/global/logout')
        ->assertOk()
        ->assertJson(['success' => true]);

    // Reset the auth guard cache between requests to ensure a fresh token lookup.
    // In tests, the same application/guard instance is reused, so we must clear
    // the resolved user from the RequestGuard.
    $this->app['auth']->forgetGuards();

    // Token revoked: subsequent me request should be 401
    $this->withToken($token)->getJson('/api/v1/auth/global/me')
        ->assertUnauthorized();
});

it('returns tenant list for authenticated user', function () {
    $this->setUpTenant();
    $plan = $this->basePlan;

    TenantMembership::create([
        'global_user_id' => $this->globalUser->id,
        'tenant_id' => $this->tenant->id,
        'role' => 'admin',
        'status' => 'active',
    ]);

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    $token = $this->globalUser->createToken('test')->plainTextToken;

    $response = $this->withToken($token)->getJson('/api/v1/auth/global/tenants');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.id'))->toBe($this->tenant->id);
    expect($response->json('data.0.role'))->toBe('admin');

    $this->tearDownTenant();
});

it('returns empty tenant list when user has no memberships', function () {
    $token = $this->globalUser->createToken('test')->plainTextToken;

    $response = $this->withToken($token)->getJson('/api/v1/auth/global/tenants');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(0);
});

it('blocks access when membership is not active', function () {
    $this->setUpTenant();
    $plan = $this->basePlan;

    TenantMembership::create([
        'global_user_id' => $this->globalUser->id,
        'tenant_id' => $this->tenant->id,
        'role' => 'admin',
        'status' => 'invited', // not active
    ]);

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    $token = $this->globalUser->createToken('test')->plainTextToken;

    // The tenant list endpoint is global (no x-tenant), so it works fine
    // Check membership filtering: inactive memberships are not included
    $response = $this->withToken($token)->getJson('/api/v1/auth/global/tenants');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(0);

    $this->tearDownTenant();
});

it('EnsureTenantMembership blocks access without membership when using auth:global', function () {
    $this->setUpTenant();
    $plan = $this->basePlan;

    // No membership created for this user + tenant

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    $token = $this->globalUser->createToken('test')->plainTextToken;

    // Accessing the global/me route with x-tenant header: EnsureTenantMembership fires
    // auth:global middleware is used here — user IS authenticated as GlobalUser
    // but has no membership in this tenant → 403
    $response = $this->withToken($token)
        ->withHeader('X-Tenant', $this->tenant->id)
        ->getJson('/api/v1/auth/global/me');

    $response->assertForbidden();

    $this->tearDownTenant();
});

it('EnsureTenantMembership blocks when subscription is inactive', function () {
    $this->setUpTenant();
    $plan = $this->basePlan;

    TenantMembership::create([
        'global_user_id' => $this->globalUser->id,
        'tenant_id' => $this->tenant->id,
        'role' => 'admin',
        'status' => 'active',
    ]);

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment', // not active
    ]);

    $token = $this->globalUser->createToken('test')->plainTextToken;

    $response = $this->withToken($token)
        ->withHeader('X-Tenant', $this->tenant->id)
        ->getJson('/api/v1/auth/global/me');

    $response->assertStatus(402);

    $this->tearDownTenant();
});
