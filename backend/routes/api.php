<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DdtController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\MaterialCategoryController;
use App\Http\Controllers\Api\V1\MaterialController;
use App\Http\Controllers\Api\V1\MaterialDependencyTypeController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\SiteController;
use App\Http\Controllers\Api\V1\SiteDdtController;
use App\Http\Controllers\Api\V1\SiteMaterialController;
use App\Http\Controllers\Api\V1\StockMovementController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\WarehouseController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// API v1 routes
Route::prefix('v1')->group(function () {
    // Public routes (no authentication)
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
    });

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth routes
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });

        Route::apiResource('users', \App\Http\Controllers\Api\V1\UserController::class);

        // Customers
        Route::apiResource('customers', CustomerController::class);

        // Sites
        Route::apiResource('sites', SiteController::class);

        // Suppliers
        Route::apiResource('suppliers', SupplierController::class);

        // Quotes
        Route::apiResource('quotes', QuoteController::class);
        Route::patch('quotes/{quote}/status', [QuoteController::class, 'changeStatus']);
        Route::get('quotes/{quote}/pdf/download', [QuoteController::class, 'downloadPdf']);
        Route::get('quotes/{quote}/pdf/preview', [QuoteController::class, 'previewPdf']);

        // Media Library (generico per tutti i modelli)
        Route::post('media/{modelType}/{modelId}', [MediaController::class, 'upload']);
        Route::get('media/{media}/download', [MediaController::class, 'download']);
        Route::delete('media/{media}', [MediaController::class, 'destroy']);

        // Materials
        Route::apiResource('materials', MaterialController::class);
        Route::get('materials-needing-reorder', [MaterialController::class, 'needingReorder']);
        Route::get('materials/{material}/kit-breakdown', [MaterialController::class, 'kitBreakdown']);
        Route::get('materials/categories/list', [MaterialController::class, 'categories']);
        Route::post('materials/{material}/calculate-price', [MaterialController::class, 'calculatePrice']);

        // Kit Components
        Route::post('materials/{material}/components', [MaterialController::class, 'addComponent']);
        Route::patch('materials/{material}/components/{componentId}', [MaterialController::class, 'updateComponent']);
        Route::delete('materials/{material}/components/{componentId}', [MaterialController::class, 'deleteComponent']);

        // Material Dependencies
        Route::get('materials/{material}/dependencies', [MaterialController::class, 'getDependencies']);
        Route::post('materials/{material}/dependencies/calculate', [MaterialController::class, 'calculateDependencies']);
        Route::post('materials/{material}/dependencies', [MaterialController::class, 'addDependency']);
        Route::patch('materials/{material}/dependencies/{dependencyId}', [MaterialController::class, 'updateDependency']);
        Route::delete('materials/{material}/dependencies/{dependencyId}', [MaterialController::class, 'deleteDependency']);

        // Material Categories
        Route::apiResource('material-categories', MaterialCategoryController::class);

        // Material Dependency Types
        Route::apiResource('material-dependency-types', MaterialDependencyTypeController::class);

        // Warehouses
        Route::apiResource('warehouses', WarehouseController::class);
        Route::get('warehouses/{warehouse}/inventory', [WarehouseController::class, 'getInventory']);

        // Inventory
        Route::get('inventory', [InventoryController::class, 'index']);
        Route::get('inventory/warehouse/{warehouseId}', [InventoryController::class, 'byWarehouse']);
        Route::get('inventory/material/{materialId}', [InventoryController::class, 'byMaterial']);
        Route::get('inventory/low-stock', [InventoryController::class, 'lowStock']);
        Route::get('inventory/valuation', [InventoryController::class, 'valuation']);
        Route::post('inventory/adjust', [InventoryController::class, 'adjust']);
        Route::post('inventory/minimum-stock', [InventoryController::class, 'updateMinimumStock']);

        // Stock Movements
        Route::get('stock-movements', [StockMovementController::class, 'index']);
        Route::post('stock-movements/intake', [StockMovementController::class, 'intake']);
        Route::post('stock-movements/output', [StockMovementController::class, 'output']);
        Route::post('stock-movements/transfer', [StockMovementController::class, 'transfer']);
        Route::post('stock-movements/rental-out', [StockMovementController::class, 'rentalOut']);
        Route::post('stock-movements/rental-return', [StockMovementController::class, 'rentalReturn']);
        Route::post('stock-movements/deliver-to-site', [StockMovementController::class, 'deliverToSite']);
        Route::post('stock-movements/return-from-site', [StockMovementController::class, 'returnFromSite']);

        // Site Materials
        Route::get('sites/{site}/materials', [SiteMaterialController::class, 'index']);
        Route::get('sites/{site}/materials/extras', [SiteMaterialController::class, 'extras']);
        Route::post('sites/{site}/materials', [SiteMaterialController::class, 'store']);
        Route::patch('sites/{site}/materials/{material}', [SiteMaterialController::class, 'update']);
        Route::delete('sites/{site}/materials/{material}', [SiteMaterialController::class, 'destroy']);
        Route::post('sites/{site}/materials/{material}/log-usage', [SiteMaterialController::class, 'logUsage']);

        // Site DDTs
        Route::get('sites/{site}/ddts', [SiteDdtController::class, 'index']);
        Route::post('sites/{site}/ddts/{ddt}/confirm', [SiteDdtController::class, 'confirm']);
        Route::post('sites/{site}/ddts/confirm-multiple', [SiteDdtController::class, 'confirmMultiple']);
        Route::post('sites/{site}/materials/{material}/reserve', [SiteMaterialController::class, 'reserve']);
        Route::post('sites/{site}/materials/{material}/deliver', [SiteMaterialController::class, 'deliver']);
        Route::post('sites/{site}/materials/{material}/return', [SiteMaterialController::class, 'returnMaterial']);
        Route::post('sites/{site}/materials/{material}/transfer', [SiteMaterialController::class, 'transferToSite']);

        // DDT (Documento Di Trasporto)
        Route::get('ddts/next-number', [DdtController::class, 'getNextNumber']);
        Route::apiResource('ddts', DdtController::class);
        Route::post('ddts/{ddt}/confirm', [DdtController::class, 'confirm']);
        Route::post('ddts/{ddt}/cancel', [DdtController::class, 'cancel']);
        Route::post('ddts/{ddt}/mark-delivered', [DdtController::class, 'markAsDelivered']);
    });
});
