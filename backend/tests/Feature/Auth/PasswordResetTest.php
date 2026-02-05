<?php

use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use App\Notifications\PasswordResetSuccessful;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
});

test('user can request password reset link', function () {
    $user = User::factory()->create(['email' => 'test@example.com']);

    $response = $this->postJson('/api/v1/auth/forgot-password', [
        'email' => 'test@example.com',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Password reset link sent to your email',
        ]);
});

test('password reset fails with invalid email', function () {
    $response = $this->postJson('/api/v1/auth/forgot-password', [
        'email' => 'nonexistent@example.com',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('user can reset password with valid token', function () {
    $user = User::factory()->create(['email' => 'test@example.com']);

    // Generate a valid token
    $token = Password::createToken($user);

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'email' => 'test@example.com',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
        'token' => $token,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Password reset successfully',
        ]);

    // Verify password was changed
    $user->refresh();
    expect(Hash::check('NewPassword123!', $user->password))->toBeTrue();

    // Verify all tokens were revoked
    expect($user->tokens()->count())->toBe(0);

    // Verify security email was sent
    Notification::assertSentTo($user, PasswordResetSuccessful::class);
});

test('password reset fails with invalid token', function () {
    $user = User::factory()->create(['email' => 'test@example.com']);

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'email' => 'test@example.com',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
        'token' => 'invalid-token',
    ]);

    $response->assertStatus(400)
        ->assertJson([
            'success' => false,
            'message' => 'Invalid or expired reset token',
        ]);
});

test('authenticated user can change password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $token = $user->createToken('test-device')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/change-password', [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);

    // Verify password was changed
    $user->refresh();
    expect(Hash::check('NewPassword123!', $user->password))->toBeTrue();

    // Verify security email was sent
    Notification::assertSentTo($user, PasswordChangedNotification::class);
});

test('change password fails with incorrect current password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $token = $user->createToken('test-device')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/change-password', [
            'current_password' => 'WrongPassword!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['current_password']);
});

test('change password requires authentication', function () {
    $response = $this->postJson('/api/v1/auth/change-password', [
        'current_password' => 'OldPassword123!',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ]);

    $response->assertUnauthorized();
});
