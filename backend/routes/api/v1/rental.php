<?php

use App\Http\Controllers\Api\V1\Rentals\RentalAnalyticsController;
use App\Http\Controllers\Api\V1\Rentals\RentalProfileController;

Route::middleware('feature:rental')->group(function () {
    Route::apiResource('rental-profiles', RentalProfileController::class);
    Route::post('rental-profiles/{rentalProfile}/recalculate', [RentalProfileController::class, 'recalculate']);

    Route::get('rental-analytics', [RentalAnalyticsController::class, 'index']);
});
