<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ContractorController;
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
use App\Http\Controllers\Api\V1\SiteWorkerController;
use App\Http\Controllers\Api\V1\StockMovementController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\WarehouseController;
use App\Http\Controllers\Api\V1\WorkerController;
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
        Route::get('suppliers/{supplier}/workers', [SupplierController::class, 'getWorkers']);
        Route::get('suppliers/{supplier}/rates', [SupplierController::class, 'getRates']);
        Route::get('suppliers/{supplier}/statistics', [SupplierController::class, 'getStatistics']);

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

        // Site Workers (Team Management)
        Route::get('sites/{site}/workers', [SiteWorkerController::class, 'indexBySite']);
        Route::post('sites/{site}/workers', [SiteWorkerController::class, 'store']);
        Route::get('workers/{worker}/sites', [SiteWorkerController::class, 'indexByWorker']);
        Route::get('site-workers/{site_worker}', [SiteWorkerController::class, 'show']);
        Route::put('site-workers/{site_worker}', [SiteWorkerController::class, 'update']);
        Route::delete('site-workers/{site_worker}', [SiteWorkerController::class, 'destroy']);
        Route::post('site-workers/{site_worker}/accept', [SiteWorkerController::class, 'accept']);
        Route::post('site-workers/{site_worker}/reject', [SiteWorkerController::class, 'reject']);
        Route::post('site-workers/{site_worker}/change-status', [SiteWorkerController::class, 'changeStatus']);
        Route::post('site-workers/{site_worker}/cancel', [SiteWorkerController::class, 'cancel']);
        Route::post('site-workers/{site_worker}/complete', [SiteWorkerController::class, 'complete']);
        Route::get('site-workers/{site_worker}/conflicts', [SiteWorkerController::class, 'checkConflicts']);
        Route::get('site-workers/{site_worker}/effective-rate', [SiteWorkerController::class, 'getEffectiveRate']);

        // DDT (Documento Di Trasporto)
        Route::get('ddts/next-number', [DdtController::class, 'getNextNumber']);
        Route::apiResource('ddts', DdtController::class);
        Route::post('ddts/{ddt}/confirm', [DdtController::class, 'confirm']);
        Route::post('ddts/{ddt}/cancel', [DdtController::class, 'cancel']);
        Route::post('ddts/{ddt}/mark-delivered', [DdtController::class, 'markAsDelivered']);

        // Workers (Collaboratori)
        Route::apiResource('workers', WorkerController::class);
        Route::post('workers/{worker}/deactivate', [WorkerController::class, 'deactivate']);
        Route::post('workers/{worker}/reactivate', [WorkerController::class, 'reactivate']);
        Route::get('workers/{worker}/statistics', [WorkerController::class, 'statistics']);
        Route::get('workers/available/list', [WorkerController::class, 'available']);

        // Worker Rates
        Route::get('workers/{worker}/rates', [\App\Http\Controllers\Api\V1\WorkerRateController::class, 'index']);
        Route::get('workers/{worker}/rates/current', [\App\Http\Controllers\Api\V1\WorkerRateController::class, 'current']);
        Route::post('workers/{worker}/rates', [\App\Http\Controllers\Api\V1\WorkerRateController::class, 'store']);
        Route::delete('workers/{worker}/rates/{rate}', [\App\Http\Controllers\Api\V1\WorkerRateController::class, 'destroy']);
        Route::get('workers/{worker}/rates/history', [\App\Http\Controllers\Api\V1\WorkerRateController::class, 'history']);
        Route::post('workers/{worker}/rates/calculate', [\App\Http\Controllers\Api\V1\WorkerRateController::class, 'calculate']);

        // Worker Sites
        Route::get('workers/{worker}/sites', [\App\Http\Controllers\Api\V1\WorkerSiteController::class, 'index']);
        Route::post('workers/{worker}/sites', [\App\Http\Controllers\Api\V1\WorkerSiteController::class, 'store']);
        Route::delete('workers/{worker}/sites/{site}', [\App\Http\Controllers\Api\V1\WorkerSiteController::class, 'destroy']);
        Route::get('workers/{worker}/sites/{site}/statistics', [\App\Http\Controllers\Api\V1\WorkerSiteController::class, 'statistics']);

        // Contractors (Cooperative/Ditte Esterne)
        Route::apiResource('contractors', ContractorController::class);
        Route::get('contractors/{contractor}/statistics', [ContractorController::class, 'statistics']);
        Route::get('contractors/{contractor}/pending-invoices', [ContractorController::class, 'pendingInvoices']);

        // Contractor Rates
        Route::get('contractors/{contractor}/rates', [\App\Http\Controllers\Api\V1\ContractorRateController::class, 'index']);
        Route::get('contractors/{contractor}/rates/current', [\App\Http\Controllers\Api\V1\ContractorRateController::class, 'current']);
        Route::post('contractors/{contractor}/rates', [\App\Http\Controllers\Api\V1\ContractorRateController::class, 'store']);
        Route::get('contractors/{contractor}/rates/history', [\App\Http\Controllers\Api\V1\ContractorRateController::class, 'history']);

        // Site Workers
        Route::get('sites/{site}/workers', [\App\Http\Controllers\Api\V1\SiteWorkerController::class, 'index']);
        Route::post('sites/{site}/workers', [\App\Http\Controllers\Api\V1\SiteWorkerController::class, 'store']);
        Route::put('sites/{site}/workers/{worker}', [\App\Http\Controllers\Api\V1\SiteWorkerController::class, 'update']);
        Route::delete('sites/{site}/workers/{worker}', [\App\Http\Controllers\Api\V1\SiteWorkerController::class, 'destroy']);

        // Site Labor Costs
        Route::get('sites/{site}/labor-costs', [\App\Http\Controllers\Api\V1\SiteLaborCostController::class, 'index']);
        Route::post('sites/{site}/labor-costs', [\App\Http\Controllers\Api\V1\SiteLaborCostController::class, 'store']);
        Route::put('sites/{site}/labor-costs/{laborCost}', [\App\Http\Controllers\Api\V1\SiteLaborCostController::class, 'update']);
        Route::delete('sites/{site}/labor-costs/{laborCost}', [\App\Http\Controllers\Api\V1\SiteLaborCostController::class, 'destroy']);
        Route::get('sites/{site}/labor-costs/breakdown', [\App\Http\Controllers\Api\V1\SiteLaborCostController::class, 'breakdown']);
        Route::get('sites/{site}/labor-costs/monthly', [\App\Http\Controllers\Api\V1\SiteLaborCostController::class, 'monthly']);
        Route::get('sites/{site}/labor-costs/by-worker', [\App\Http\Controllers\Api\V1\SiteLaborCostController::class, 'byWorker']);
    });
});
