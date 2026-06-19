<?php

use App\Http\Controllers\Api\V1\FinalBilances\FinalBalanceController;

Route::get('final-balances/next-number', [FinalBalanceController::class, 'nextNumber']);
Route::get('final-balances', [FinalBalanceController::class, 'index']);
Route::post('final-balances', [FinalBalanceController::class, 'store']);
Route::get('final-balances/{finalBalance}', [FinalBalanceController::class, 'show']);
Route::put('final-balances/{finalBalance}', [FinalBalanceController::class, 'update']);
Route::delete('final-balances/{finalBalance}', [FinalBalanceController::class, 'destroy']);
Route::post('final-balances/{finalBalance}/finalize', [FinalBalanceController::class, 'finalize']);
Route::post('final-balances/{finalBalance}/approve', [FinalBalanceController::class, 'approve']);
Route::post('final-balances/{finalBalance}/items', [FinalBalanceController::class, 'storeItem']);
Route::put('final-balance-items/{item}', [FinalBalanceController::class, 'updateItem']);
Route::delete('final-balance-items/{item}', [FinalBalanceController::class, 'destroyItem']);
Route::patch('final-balance-items/{item}/reorder', [FinalBalanceController::class, 'reorderItem']);
