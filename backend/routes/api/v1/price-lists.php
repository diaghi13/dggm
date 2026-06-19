<?php

use App\Http\Controllers\Api\V1\PriceLists\PriceListController;
use App\Http\Controllers\Api\V1\PriceLists\PriceListItemController;

Route::prefix('price-lists')->group(function () {
    Route::get('default', [PriceListController::class, 'getDefault']);
    Route::get('/', [PriceListController::class, 'index']);
    Route::post('/', [PriceListController::class, 'store']);
    Route::get('/{priceList}', [PriceListController::class, 'show']);
    Route::put('/{priceList}', [PriceListController::class, 'update']);
    Route::delete('/{priceList}', [PriceListController::class, 'destroy']);
    Route::post('/{priceList}/regenerate', [PriceListController::class, 'regenerate']);

    // Price List Items (nested resource)
    Route::get('/{priceList}/items', [PriceListItemController::class, 'index']);
    Route::post('/{priceList}/items', [PriceListItemController::class, 'store']);
    Route::put('/{priceList}/items/{item}', [PriceListItemController::class, 'update']);
    Route::delete('/{priceList}/items/{item}', [PriceListItemController::class, 'destroy']);
    Route::post('/{priceList}/items/{item}/recalculate', [PriceListItemController::class, 'recalculate']);
});
