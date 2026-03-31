<?php

declare(strict_types=1);

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\Plan;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use Tests\Traits\CreatesTestTenant;

uses(\Tests\TestCase::class, CreatesTestTenant::class);

beforeEach(function () {
    (new \Database\Seeders\PlanSeeder)->run();

    $this->globalUser = GlobalUser::create([
        'name' => 'Worker Test User',
        'email' => 'worker-overview-'.uniqid().'@example.com',
        'password' => 'password',
        'phone' => '+39 333 1234567',
    ]);

    $this->token = $this->globalUser->createToken('test')->plainTextToken;
});

afterEach(function () {
    $this->globalUser->tokens()->delete();
    $this->globalUser->forceDelete();
});

it('can get global worker profile', function () {
    $response = $this->withToken($this->token)
        ->getJson('/api/v1/my/profile');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'email' => $this->globalUser->email,
                'name' => $this->globalUser->name,
            ],
        ]);
});

it('can update global worker profile', function () {
    $response = $this->withToken($this->token)
        ->patchJson('/api/v1/my/profile', [
            'phone' => '+39 333 9876543',
            'city' => 'Milano',
        ]);

    $response->assertOk()->assertJson(['success' => true]);
    expect($this->globalUser->fresh()->phone)->toBe('+39 333 9876543');
    expect($this->globalUser->fresh()->city)->toBe('Milano');
});

it('can get overview with no tenants', function () {
    $response = $this->withToken($this->token)
        ->getJson('/api/v1/my/overview');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => ['tenants' => []],
        ]);
});

it('can get overview with tenant membership', function () {
    $this->setUpTenant();
    $plan = Plan::where('slug', 'base')->first();

    TenantSubscription::create([
        'tenant_id' => $this->tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
    ]);

    TenantMembership::create([
        'global_user_id' => $this->globalUser->id,
        'tenant_id' => $this->tenant->id,
        'role' => 'worker',
        'status' => 'active',
    ]);

    $response = $this->withToken($this->token)
        ->getJson('/api/v1/my/overview');

    $response->assertOk();
    expect($response->json('data.tenants'))->toHaveCount(1);
    expect($response->json('data.tenants.0.tenant_id'))->toBe($this->tenant->id);

    TenantSubscription::where('tenant_id', $this->tenant->id)->delete();
    TenantMembership::where('tenant_id', $this->tenant->id)->delete();
    $this->tearDownTenant();
});

it('requires authentication for worker routes', function () {
    $this->getJson('/api/v1/my/profile')->assertUnauthorized();
    $this->getJson('/api/v1/my/overview')->assertUnauthorized();
});
