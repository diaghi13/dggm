<?php

use App\Http\Controllers\Api\V1\FinalBilances\FinalBalanceController;
use App\Http\Controllers\Api\V1\Projects\ProjectAvailabilityCheckController;
use App\Http\Controllers\Api\V1\Projects\ProjectController;

Route::apiResource('projects', ProjectController::class);

Route::get('projects/{project}/final-balances', [FinalBalanceController::class, 'indexByProject']);
Route::post('projects/{project}/final-balances/generate', [FinalBalanceController::class, 'generate']);

// Project Availability Checks (Step 7)
Route::post('projects/{project}/availability-check', [ProjectAvailabilityCheckController::class, 'run']);
Route::get('projects/{project}/availability-checks', [ProjectAvailabilityCheckController::class, 'index']);
Route::get('projects/{project}/availability-checks/latest', [ProjectAvailabilityCheckController::class, 'latest']);
Route::patch('project-availability-items/{item}/resolve', [ProjectAvailabilityCheckController::class, 'resolveItem']);
