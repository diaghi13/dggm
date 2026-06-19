<?php

use App\Http\Controllers\Api\V1\DiscountFamilyController;
use App\Http\Controllers\Api\V1\FinalBilances\FinancialResourceController;
use App\Http\Controllers\Api\V1\Materials\MaterialCategoryController;
use App\Http\Controllers\Api\V1\Materials\MaterialDependencyTypeController;
use App\Http\Controllers\Api\V1\PaymentTermController;
use App\Http\Controllers\Api\V1\Products\ImportController;
use App\Http\Controllers\Api\V1\Products\ProductUnitTypeController;
use App\Http\Controllers\Api\V1\WarrantyTypeController;

Route::apiResource('payment-terms', PaymentTermController::class);

Route::prefix('financial-resources')->group(function () {
    Route::get('active', [FinancialResourceController::class, 'getActive']);
    Route::get('defaults', [FinancialResourceController::class, 'getDefaults']);
});
Route::apiResource('financial-resources', FinancialResourceController::class);

Route::apiResource('discount-families', DiscountFamilyController::class);

Route::get('warranty-types/default', [WarrantyTypeController::class, 'getDefault']);
Route::apiResource('warranty-types', WarrantyTypeController::class);

Route::get('unit-types', [ProductUnitTypeController::class, 'index']);
Route::get('unit-types/category/{category}', [ProductUnitTypeController::class, 'byCategory']);

// DEPRECATED: use product-categories instead
Route::apiResource('material-categories', MaterialCategoryController::class);

Route::get('import/models', [ImportController::class, 'getAvailableModels']);
Route::get('import/{model}/fields', [ImportController::class, 'getImportableFields']);
Route::post('import/supplier-catalog', [ImportController::class, 'importSupplierCatalog']);

Route::apiResource('material-dependency-types', MaterialDependencyTypeController::class);
