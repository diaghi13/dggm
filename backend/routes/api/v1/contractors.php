<?php

use App\Http\Controllers\Api\V1\ContractorController;
use App\Http\Controllers\Api\V1\Contractors\ContractorRateController;
use App\Http\Controllers\Api\V1\TenantInvitationController;

Route::apiResource('contractors', ContractorController::class);
Route::get('contractors/{contractor}/statistics', [ContractorController::class, 'statistics']);
Route::get('contractors/{contractor}/pending-invoices', [ContractorController::class, 'pendingInvoices']);

Route::get('contractors/{contractor}/rates', [ContractorRateController::class, 'index']);
Route::get('contractors/{contractor}/rates/current', [ContractorRateController::class, 'current']);
Route::post('contractors/{contractor}/rates', [ContractorRateController::class, 'store']);
Route::get('contractors/{contractor}/rates/history', [ContractorRateController::class, 'history']);

Route::post('tenant-invitations', [TenantInvitationController::class, 'invite']);
