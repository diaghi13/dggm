<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Auth\GlobalAuthController;
use App\Http\Controllers\Auth\RegisterController;

// Public routes (no authentication)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']); // public: must clear cookie even with invalid token
    Route::post('/switch-tenant', [AuthController::class, 'switchTenant']); // public: uses auth:global internally
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Company registration (public)
Route::post('auth/register', [RegisterController::class, 'register']);
Route::get('auth/tenant-status/{tenantId}', [RegisterController::class, 'tenantStatus']);

// Global auth routes (landlord DB, cross-tenant token)
// Login is public — no auth required
Route::post('auth/global/login', [GlobalAuthController::class, 'login']);

// Protected auth routes (require sanctum token)
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/sessions', [AuthController::class, 'sessions']);
    Route::delete('/sessions/{tokenId}', [AuthController::class, 'revokeSession']);
    Route::post('/sessions/revoke-others', [AuthController::class, 'revokeOtherSessions']);
});
