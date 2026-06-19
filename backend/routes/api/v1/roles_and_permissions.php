<?php

use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RoleController;

// Roles & Permissions
Route::apiResource('roles', RoleController::class);
Route::post('roles/{role}/permissions/{permission}', [RoleController::class, 'assignPermission']);
Route::delete('roles/{role}/permissions/{permission}', [RoleController::class, 'revokePermission']);
Route::post('roles/{role}/sync-permissions', [RoleController::class, 'syncPermissions']);

Route::get('permissions/grouped', [PermissionController::class, 'getGrouped']);
Route::apiResource('permissions', PermissionController::class);
