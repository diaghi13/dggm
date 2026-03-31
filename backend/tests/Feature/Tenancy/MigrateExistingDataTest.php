<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // Ensure plans are seeded (idempotent — uses firstOrCreate)
    (new \Database\Seeders\PlanSeeder)->run();
});

it('tenant:migrate-existing command exists and is callable', function () {
    expect(Artisan::all())->toHaveKey('tenant:migrate-existing');
});

it('fails gracefully with non-existent email', function () {
    $exitCode = Artisan::call('tenant:migrate-existing', [
        '--tenant-name' => 'Test Company',
        '--email' => 'nonexistent-'.uniqid().'@test.com',
        '--plan' => 'full',
        '--dry-run' => true,
    ]);

    expect($exitCode)->toBe(1); // FAILURE
});

it('fails gracefully with non-existent plan slug', function () {
    $user = User::factory()->create();

    $exitCode = Artisan::call('tenant:migrate-existing', [
        '--tenant-name' => 'Test Company',
        '--email' => $user->email,
        '--plan' => 'nonexistent-plan-'.uniqid(),
        '--dry-run' => true,
    ]);

    expect($exitCode)->toBe(1); // FAILURE

    $user->delete();
});
