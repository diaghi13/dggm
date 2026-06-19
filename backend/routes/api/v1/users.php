<?php

use App\Http\Controllers\Api\V1\CodeController;
use App\Http\Controllers\Api\V1\UserController;

Route::apiResource('users', UserController::class);
Route::post('users/{user}/roles', [UserController::class, 'assignRoles']);
Route::delete('users/{user}/roles/{role}', [UserController::class, 'revokeRole']);
Route::post('users/{user}/sync-roles', [UserController::class, 'syncRoles']);

Route::get('codes/generate/{entity}', [CodeController::class, 'generate']);
