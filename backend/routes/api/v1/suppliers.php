<?php

use App\Http\Controllers\Api\V1\SupplierController;

Route::apiResource('suppliers', SupplierController::class);
Route::get('suppliers/{supplier}/workers', [SupplierController::class, 'getWorkers']);
Route::get('suppliers/{supplier}/rates', [SupplierController::class, 'getRates']);
Route::get('suppliers/{supplier}/statistics', [SupplierController::class, 'getStatistics']);
