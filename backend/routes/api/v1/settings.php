<?php

use App\Http\Controllers\Api\V1\SettingController;

// Settings (key-value system)
Route::prefix('settings')->group(function () {
    Route::get('types', [SettingController::class, 'types']);
    Route::get('grouped', [SettingController::class, 'grouped']);

    // Feature Flags
    Route::get('feature-flags', [SettingController::class, 'featureFlags']);
    Route::get('feature-flags/enabled', [SettingController::class, 'enabledFeatures']);
    Route::post('feature-flags/{feature}/toggle', [SettingController::class, 'toggleFeature']);

    // Batch update multiple settings in one request
    Route::post('batch', [SettingController::class, 'batchUpdate']);

    // Get/Set by key (simplified endpoints)
    Route::get('key/{key}', [SettingController::class, 'getByKey'])->where('key', '.*');
    Route::post('key/{key}', [SettingController::class, 'setByKey'])->where('key', '.*');

    // Company Logo
    Route::post('company/logo', [SettingController::class, 'uploadCompanyLogo']);
    Route::delete('company/logo', [SettingController::class, 'deleteCompanyLogo']);

    // Company Images (stamp, signature)
    Route::post('company/image/{type}', [SettingController::class, 'uploadCompanyImage']);
    Route::delete('company/image/{type}', [SettingController::class, 'deleteCompanyImage']);

    // Reset to default
    Route::post('{setting}/reset', [SettingController::class, 'reset']);
});

// Standard CRUD for settings
Route::apiResource('settings', SettingController::class);
