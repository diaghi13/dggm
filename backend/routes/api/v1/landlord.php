<?php

use App\Http\Controllers\Landlord\TenantManagementController;

// Landlord Admin routes (only is_landlord_admin GlobalUsers)
Route::prefix('landlord')->middleware(['auth:global', 'landlord.admin'])->group(function () {
    Route::get('tenants', [TenantManagementController::class, 'index']);
    Route::post('tenants', [TenantManagementController::class, 'store']);
    Route::get('tenants/{id}', [TenantManagementController::class, 'show']);
    Route::patch('tenants/{id}/activate', [TenantManagementController::class, 'activate']);
    Route::patch('tenants/{id}/suspend', [TenantManagementController::class, 'suspend']);
    Route::delete('tenants/{id}', [TenantManagementController::class, 'destroy']);

    Route::get('users', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'index']);
    Route::get('users/{id}', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'show']);
    Route::patch('users/{id}', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'update']);
    Route::post('users/{id}/toggle-admin', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'toggleAdmin']);
    Route::get('users/{id}/memberships', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'memberships']);
    Route::post('users/{id}/memberships', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'addMembership']);
    Route::delete('users/{userId}/memberships/{membershipId}', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'removeMembership']);

    // Plans management (landlord admin)
    Route::prefix('plans')->group(function () {
        Route::get('/', [\App\Http\Controllers\Landlord\PlansController::class, 'adminIndex']);
        Route::post('/', [\App\Http\Controllers\Landlord\PlansController::class, 'store']);
        Route::get('{id}', [\App\Http\Controllers\Landlord\PlansController::class, 'show']);
        Route::put('{id}', [\App\Http\Controllers\Landlord\PlansController::class, 'update']);
        Route::delete('{id}', [\App\Http\Controllers\Landlord\PlansController::class, 'destroy']);
        Route::get('{id}/tenant-count', [\App\Http\Controllers\Landlord\PlansController::class, 'tenantCount']);
    });

    // Backup monitoring & management
    Route::prefix('backup')->group(function () {
        Route::get('status', [\App\Http\Controllers\Api\V1\BackupStatusController::class, 'status']);
        Route::post('run', [\App\Http\Controllers\Api\V1\BackupStatusController::class, 'runBackup']);
    });

    // Tenant monitoring dashboard
    Route::get('monitoring', [\App\Http\Controllers\Landlord\TenantMonitoringController::class, 'index']);

    // Aggregated error logs (email + failed jobs) across all tenants
    Route::get('error-logs', [\App\Http\Controllers\Landlord\TenantErrorLogController::class, 'index']);

    // Service broadcast notifications
    Route::get('broadcasts', [\App\Http\Controllers\Landlord\ServiceBroadcastController::class, 'index']);
    Route::post('broadcasts', [\App\Http\Controllers\Landlord\ServiceBroadcastController::class, 'store']);
    Route::get('broadcasts/{broadcast}', [\App\Http\Controllers\Landlord\ServiceBroadcastController::class, 'show']);
    Route::patch('broadcasts/{broadcast}/cancel', [\App\Http\Controllers\Landlord\ServiceBroadcastController::class, 'cancel']);

    // Landlord-level settings (e.g. log retention)
    Route::get('settings', [\App\Http\Controllers\Landlord\LandlordSettingsController::class, 'index']);
    Route::put('settings/{key}', [\App\Http\Controllers\Landlord\LandlordSettingsController::class, 'update']);

    // Renewal requests management
    Route::prefix('renewal-requests')->group(function () {
        Route::get('pending-count', [\App\Http\Controllers\Landlord\LandlordRenewalRequestController::class, 'pendingCount']);
        Route::get('/', [\App\Http\Controllers\Landlord\LandlordRenewalRequestController::class, 'index']);
        Route::get('{renewalRequest}', [\App\Http\Controllers\Landlord\LandlordRenewalRequestController::class, 'show']);
        Route::post('{renewalRequest}/approve', [\App\Http\Controllers\Landlord\LandlordRenewalRequestController::class, 'approve']);
        Route::post('{renewalRequest}/reject', [\App\Http\Controllers\Landlord\LandlordRenewalRequestController::class, 'reject']);
    });
});
