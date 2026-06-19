<?php

use App\Http\Controllers\Api\V1\Products\KitAssemblyController;
use App\Http\Controllers\Api\V1\Products\ProductBrandController;
use App\Http\Controllers\Api\V1\Products\ProductCategoryController;
use App\Http\Controllers\Api\V1\Products\ProductController;
use App\Http\Controllers\Api\V1\Products\ProductMediaController;
use App\Http\Controllers\Api\V1\Products\ProductPricingController;
use App\Http\Controllers\Api\V1\Products\ProductRelationController;
use App\Http\Controllers\Api\V1\Products\ProductRelationTypeController;
use App\Http\Controllers\Api\V1\Products\ProductSubrentalSupplierController;
use App\Http\Controllers\Api\V1\Products\ProductUnitTypeController;

Route::apiResource('products', ProductController::class);
Route::post('products/import', [ProductController::class, 'import']);
Route::get('products-needing-reorder', [ProductController::class, 'needingReorder']);
Route::get('products/{product}/composite-breakdown', [ProductController::class, 'compositeBreakdown']);
Route::get('products/{product}/kit-breakdown', [ProductController::class, 'kitBreakdown']);
Route::get('products/categories/list', [ProductController::class, 'categories']);
Route::post('products/{product}/calculate-price', [ProductController::class, 'calculatePrice']);

// Product Suppliers (pivot pricing data)
Route::get('products/{product}/suppliers', [ProductController::class, 'suppliers']);

// Product Media
Route::get('products/{product}/media', [ProductMediaController::class, 'index']);
Route::post('products/{product}/media', [ProductMediaController::class, 'store']);
Route::get('products/{product}/media/download-zip', [ProductMediaController::class, 'downloadCollectionZip']);
Route::get('products/{product}/media/{media}', [ProductMediaController::class, 'show']);
Route::put('products/{product}/media/{media}', [ProductMediaController::class, 'update']);
Route::delete('products/{product}/media/{media}', [ProductMediaController::class, 'destroy']);
Route::post('products/{product}/media/{media}/reorder', [ProductMediaController::class, 'reorder']);

// Product Pricing
Route::get('products/{product}/pricing', [ProductPricingController::class, 'show']);
Route::post('products/bulk-update-prices', [ProductPricingController::class, 'bulkUpdate']);
Route::post('products/preview-price-adjustment', [ProductPricingController::class, 'previewAdjustment']);

// Product Relations (unified relations system)
Route::get('products/{product}/relations', [ProductRelationController::class, 'index']);
Route::post('products/{product}/relations', [ProductRelationController::class, 'store']);
Route::post('products/{product}/relations/calculate', [ProductRelationController::class, 'calculate']);
Route::get('products/{product}/relations/quote-list', [ProductRelationController::class, 'quoteList']);
Route::get('products/{product}/relations/material-list', [ProductRelationController::class, 'materialList']);
Route::get('products/{product}/relations/stock-list', [ProductRelationController::class, 'stockList']);
Route::patch('products/{product}/relations/{relation}', [ProductRelationController::class, 'update']);
Route::delete('products/{product}/relations/{relation}', [ProductRelationController::class, 'destroy']);

// Kit Assemblies
Route::get('products/{product}/kit-assemblies', [KitAssemblyController::class, 'index']);
Route::post('products/{product}/kit-assemblies', [KitAssemblyController::class, 'store']);
Route::get('kit-assemblies/{kitAssembly}', [KitAssemblyController::class, 'show']);
Route::put('kit-assemblies/{kitAssembly}', [KitAssemblyController::class, 'update']);
Route::delete('kit-assemblies/{kitAssembly}', [KitAssemblyController::class, 'destroy']);
Route::post('kit-assemblies/{kitAssembly}/disassemble', [KitAssemblyController::class, 'disassemble']);
Route::post('kit-assemblies/{kitAssembly}/items', [KitAssemblyController::class, 'addItem']);
Route::patch('kit-assemblies/{kitAssembly}/items/{item}', [KitAssemblyController::class, 'updateItem']);
Route::delete('kit-assemblies/{kitAssembly}/items/{item}', [KitAssemblyController::class, 'removeItem']);

// Product Relation Types (configurable relation types)
Route::apiResource('product-relation-types', ProductRelationTypeController::class);

// Subrental Suppliers
Route::prefix('products/{product}/subrental-suppliers')->group(function () {
    Route::get('/', [ProductSubrentalSupplierController::class, 'index']);
    Route::post('/', [ProductSubrentalSupplierController::class, 'store']);
    Route::put('/{subrentalSupplier}', [ProductSubrentalSupplierController::class, 'update']);
    Route::delete('/{subrentalSupplier}', [ProductSubrentalSupplierController::class, 'destroy']);
});

// Product Categories (NEW - replaces material-categories)
Route::apiResource('product-categories', ProductCategoryController::class);

// Product Brands
Route::apiResource('product-brands', ProductBrandController::class);

// Product Unit Types (CRUD management - read-only /unit-types stays in registry-config.php)
Route::apiResource('product-unit-types', ProductUnitTypeController::class)->except(['byCategory']);
