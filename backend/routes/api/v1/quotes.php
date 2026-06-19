<?php

use App\Http\Controllers\Api\V1\Quotes\QuoteController;

Route::apiResource('quotes', QuoteController::class);

// Quote Status Management
Route::patch('quotes/{quote}/status', [QuoteController::class, 'changeStatus']);
Route::post('quotes/{quote}/approve', [QuoteController::class, 'approve']);
Route::post('quotes/{quote}/reject', [QuoteController::class, 'reject']);
Route::post('quotes/{quote}/send', [QuoteController::class, 'send']);
Route::post('quotes/{quote}/mark-as-sent', [QuoteController::class, 'markAsSent']);

// Quote Actions
Route::post('quotes/{quote}/convert-to-project', [QuoteController::class, 'convertToProject']);
Route::post('quotes/{quote}/save-pdf', [QuoteController::class, 'savePdf']);
Route::post('quotes/{quote}/refresh-terms', [QuoteController::class, 'refreshTerms']);
Route::post('quotes/{quote}/duplicate', [QuoteController::class, 'duplicate']);

// Quote PDF
Route::get('quotes/{quote}/pdf/download', [QuoteController::class, 'downloadPdf']);
Route::get('quotes/{quote}/pdf/preview', [QuoteController::class, 'previewPdf']);
