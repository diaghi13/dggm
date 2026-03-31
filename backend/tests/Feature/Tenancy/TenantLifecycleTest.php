<?php

declare(strict_types=1);

use App\Jobs\CreateTenantJob;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\Plan;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // Ensure plans are seeded (idempotent — uses firstOrCreate)
    (new \Database\Seeders\PlanSeeder)->run();
});

it('registers a new company and dispatches CreateTenantJob', function () {
    Bus::fake();

    $plan = Plan::where('slug', 'base')->first();

    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Mario Rossi',
        'email' => 'mario-lifecycle-'.uniqid().'@testcompany.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'company_name' => 'Test Company SRL',
        'plan_id' => $plan->id,
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'success',
            'data' => ['token', 'user', 'tenant', 'subscription_status'],
        ]);

    expect($response->json('data.subscription_status'))->toBe('pending_payment');
    expect($response->json('success'))->toBeTrue();

    Bus::assertDispatched(CreateTenantJob::class);

    // Cleanup
    $tenantId = $response->json('data.tenant.id');
    $userId = $response->json('data.user.id');
    TenantSubscription::where('tenant_id', $tenantId)->delete();
    TenantMembership::where('tenant_id', $tenantId)->delete();
    Tenant::find($tenantId)?->delete();
    $globalUser = GlobalUser::find($userId);
    $globalUser?->tokens()->delete();
    $globalUser?->forceDelete();
});

it('returns 422 when registering with duplicate email', function () {
    Bus::fake();

    $plan = Plan::where('slug', 'base')->first();
    $email = 'duplicate-lifecycle-'.uniqid().'@testcompany.com';

    $globalUser = GlobalUser::create([
        'name' => 'Existing User',
        'email' => $email,
        'password' => 'password',
    ]);

    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'New User',
        'email' => $email,
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'company_name' => 'Another Company',
        'plan_id' => $plan->id,
    ]);

    $response->assertUnprocessable();

    $globalUser->tokens()->delete();
    $globalUser->forceDelete();
});

it('returns 422 when registering with invalid plan_id', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'User',
        'email' => 'noplan-lifecycle-'.uniqid().'@test.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'company_name' => 'Company',
        'plan_id' => 999999,
    ]);

    $response->assertUnprocessable();
});

it('can get tenant status after registration', function () {
    Bus::fake();

    $plan = Plan::where('slug', 'base')->first();
    $tenant = Tenant::create(['name' => 'Status Test Co', 'slug' => 'status-test-'.uniqid()]);

    TenantSubscription::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
    ]);

    $response = $this->getJson("/api/v1/auth/tenant-status/{$tenant->id}");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'tenant_id' => $tenant->id,
                'subscription_status' => 'pending_payment',
                'tenant_name' => 'Status Test Co',
            ],
        ]);

    TenantSubscription::where('tenant_id', $tenant->id)->delete();
    $tenant->delete();
});

it('can activate a tenant via landlord admin API', function () {
    Bus::fake();

    $plan = Plan::where('slug', 'base')->first();
    $tenant = Tenant::create(['name' => 'Activate Test', 'slug' => 'activate-test-'.uniqid()]);
    $subscription = TenantSubscription::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
    ]);

    $admin = GlobalUser::create([
        'name' => 'Landlord Admin',
        'email' => 'landlord-admin-'.uniqid().'@test.com',
        'password' => 'password',
        'is_landlord_admin' => true,
    ]);

    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withToken($token)
        ->patchJson("/api/v1/landlord/tenants/{$tenant->id}/activate");

    $response->assertOk()->assertJson(['success' => true]);

    expect($subscription->fresh()->status)->toBe('active');

    // Cleanup
    $subscription->delete();
    $tenant->delete();
    $admin->tokens()->delete();
    $admin->forceDelete();
});

it('can suspend a tenant via landlord admin API', function () {
    $plan = Plan::where('slug', 'base')->first();
    $tenant = Tenant::create(['name' => 'Suspend Test', 'slug' => 'suspend-test-'.uniqid()]);
    $subscription = TenantSubscription::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    $admin = GlobalUser::create([
        'name' => 'Landlord Admin',
        'email' => 'landlord-admin-suspend-'.uniqid().'@test.com',
        'password' => 'password',
        'is_landlord_admin' => true,
    ]);

    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withToken($token)
        ->patchJson("/api/v1/landlord/tenants/{$tenant->id}/suspend");

    $response->assertOk()->assertJson(['success' => true]);

    expect($subscription->fresh()->status)->toBe('suspended');

    // Cleanup
    $subscription->delete();
    $tenant->delete();
    $admin->tokens()->delete();
    $admin->forceDelete();
});

it('can list tenants via landlord admin API', function () {
    $plan = Plan::where('slug', 'base')->first();
    $tenant = Tenant::create(['name' => 'List Test Co', 'slug' => 'list-test-'.uniqid()]);
    $subscription = TenantSubscription::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
    ]);

    $admin = GlobalUser::create([
        'name' => 'Landlord Admin',
        'email' => 'landlord-admin-list-'.uniqid().'@test.com',
        'password' => 'password',
        'is_landlord_admin' => true,
    ]);

    $token = $admin->createToken('test')->plainTextToken;

    $response = $this->withToken($token)
        ->getJson('/api/v1/landlord/tenants');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data',
            'meta' => ['current_page', 'total'],
        ]);

    // Cleanup
    $subscription->delete();
    $tenant->delete();
    $admin->tokens()->delete();
    $admin->forceDelete();
});

it('blocks non-admin from landlord routes', function () {
    $user = GlobalUser::create([
        'name' => 'Regular User',
        'email' => 'regular-lifecycle-'.uniqid().'@test.com',
        'password' => 'password',
        'is_landlord_admin' => false,
    ]);

    $token = $user->createToken('test')->plainTextToken;

    $response = $this->withToken($token)
        ->getJson('/api/v1/landlord/tenants');

    $response->assertForbidden();

    $user->tokens()->delete();
    $user->forceDelete();
});

it('blocks unauthenticated access to landlord routes', function () {
    $this->getJson('/api/v1/landlord/tenants')
        ->assertUnauthorized();
});
