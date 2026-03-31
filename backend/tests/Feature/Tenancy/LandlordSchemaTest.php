<?php

declare(strict_types=1);

use App\Models\Landlord\GlobalUser;
use Tests\TestCase;

uses(TestCase::class);

use App\Models\Landlord\Plan;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use App\Models\Tenant;

beforeAll(function () {
    (new \Database\Seeders\PlanSeeder)->run();
});

it('can create a global user', function () {
    $user = GlobalUser::create([
        'name' => 'Test User',
        'email' => 'test-landlord-schema@example.com',
        'password' => 'password',
    ]);

    expect($user->id)->not->toBeNull();
    expect($user->email)->toBe('test-landlord-schema@example.com');

    $user->forceDelete();
});

it('has plans seeded correctly', function () {
    expect(Plan::count())->toBeGreaterThanOrEqual(4);
    expect(Plan::where('slug', 'base')->exists())->toBeTrue();
    expect(Plan::where('slug', 'full')->exists())->toBeTrue();
});

it('full plan has all features', function () {
    $fullPlan = Plan::where('slug', 'full')->first();
    $features = $fullPlan->features->pluck('feature_key')->toArray();

    expect($features)->toContain('quotes');
    expect($features)->toContain('projects');
    expect($features)->toContain('warehouse');
    expect($features)->toContain('workers');
    expect($features)->toContain('rental');
});

it('can create tenant membership', function () {
    $user = GlobalUser::create([
        'name' => 'Membership Test User',
        'email' => 'membership-landlord-schema@example.com',
        'password' => 'password',
    ]);

    $tenant = Tenant::create(['name' => 'Test Co', 'slug' => 'test-co-'.uniqid()]);

    $membership = TenantMembership::create([
        'global_user_id' => $user->id,
        'tenant_id' => $tenant->id,
        'role' => 'admin',
        'status' => 'active',
    ]);

    expect($membership->id)->not->toBeNull();
    expect($user->tenantMemberships()->count())->toBe(1);

    $membership->delete();
    $user->forceDelete();
    $tenant->delete();
});

it('can create tenant subscription', function () {
    $plan = Plan::where('slug', 'base')->first();
    $tenant = Tenant::create(['name' => 'Sub Test', 'slug' => 'sub-test-'.uniqid()]);

    $subscription = TenantSubscription::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'status' => 'pending_payment',
    ]);

    expect($subscription->isActive())->toBeFalse();

    $subscription->update(['status' => 'active']);
    expect($subscription->fresh()->isActive())->toBeTrue();

    $subscription->delete();
    $tenant->delete();
});

it('global user has uuid primary key', function () {
    $user = GlobalUser::create([
        'name' => 'UUID Test',
        'email' => 'uuid-test-landlord-schema@example.com',
        'password' => 'password',
    ]);

    expect(strlen((string) $user->id))->toBe(36); // UUID length with dashes
    expect(preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $user->id))->toBe(1);

    $user->forceDelete();
});

it('plan features belong to correct plan', function () {
    $basePlan = Plan::where('slug', 'base')->first();
    $features = $basePlan->features->pluck('feature_key')->toArray();

    expect($features)->toContain('customers');
    expect($features)->toContain('suppliers');
    expect($features)->toContain('quotes');
    expect($features)->toContain('projects');
    expect($features)->not->toContain('warehouse');
    expect($features)->not->toContain('workers');
    expect($features)->not->toContain('rental');
});
