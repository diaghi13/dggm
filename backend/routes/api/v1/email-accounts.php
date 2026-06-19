<?php

use App\Http\Controllers\Api\V1\Emails\EmailAccountController;
use App\Http\Controllers\Api\V1\Emails\EmailAccountOAuthController;
use App\Http\Controllers\Api\V1\Emails\EmailLogController;

Route::apiResource('email-accounts', EmailAccountController::class);
Route::post('email-accounts/{emailAccount}/test', [EmailAccountController::class, 'test']);
Route::post('email-accounts/{emailAccount}/set-default', [EmailAccountController::class, 'setDefault']);

Route::get('email-accounts/oauth/{provider}/redirect', [EmailAccountOAuthController::class, 'redirect']);

Route::get('email-logs', [EmailLogController::class, 'index']);
Route::get('email-logs/{emailLog}', [EmailLogController::class, 'show']);
