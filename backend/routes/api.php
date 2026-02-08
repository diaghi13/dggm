<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ContractorController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DdtController;
use App\Http\Controllers\Api\V1\ImportController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\MaterialCategoryController;
use App\Http\Controllers\Api\V1\MaterialDependencyTypeController;
use App\Http\Controllers\Api\V1\MaterialRequestController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\PriceListController;
use App\Http\Controllers\Api\V1\PriceListItemController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductPricingController;
use App\Http\Controllers\Api\V1\ProductRelationController;
use App\Http\Controllers\Api\V1\ProductRelationTypeController;
use App\Http\Controllers\Api\V1\ProductUnitTypeController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\SiteController;
use App\Http\Controllers\Api\V1\SiteDdtController;
use App\Http\Controllers\Api\V1\SiteMaterialController;
use App\Http\Controllers\Api\V1\SiteRoleController;
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

// Password reset web route (for email links)
// This redirects to frontend with token
Route::get('/password-reset/{token}', function ($token) {
    $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
    $email = request()->query('email');

    return redirect()->away("{$frontendUrl}/reset-password?token={$token}&email={$email}");
})->name('password.reset');

// API v1 routes
Route::prefix('v1')->group(function () {
    // Public routes (no authentication)
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    });

    // Public invitation routes (no authentication)
    Route::get('invitations/{token}', [InvitationController::class, 'showByToken']);
    Route::post('invitations/{token}/accept', [InvitationController::class, 'accept']);

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth routes
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);

            // Session management
            Route::get('/sessions', [AuthController::class, 'sessions']);
            Route::delete('/sessions/{tokenId}', [AuthController::class, 'revokeSession']);
            Route::post('/sessions/revoke-others', [AuthController::class, 'revokeOtherSessions']);
        });

        Route::apiResource('users', \App\Http\Controllers\Api\V1\UserController::class);
        Route::post('users/{user}/roles', [\App\Http\Controllers\Api\V1\UserController::class, 'assignRoles']);
        Route::delete('users/{user}/roles/{role}', [\App\Http\Controllers\Api\V1\UserController::class, 'revokeRole']);
        Route::post('users/{user}/sync-roles', [\App\Http\Controllers\Api\V1\UserController::class, 'syncRoles']);

        // Roles & Permissions
        Route::apiResource('roles', RoleController::class);
        Route::post('roles/{role}/permissions/{permission}', [RoleController::class, 'assignPermission']);
        Route::delete('roles/{role}/permissions/{permission}', [RoleController::class, 'revokePermission']);
        Route::post('roles/{role}/sync-permissions', [RoleController::class, 'syncPermissions']);

        Route::get('permissions/grouped', [PermissionController::class, 'getGrouped']);
        Route::apiResource('permissions', PermissionController::class);

        // Settings (key-value system)
        Route::prefix('settings')->group(function () {
            // Get all available setting types
            Route::get('types', [SettingController::class, 'types']);

            // Get settings grouped by category
            Route::get('grouped', [SettingController::class, 'grouped']);

            // Feature Flags
            Route::get('feature-flags', [SettingController::class, 'featureFlags']);
            Route::get('feature-flags/enabled', [SettingController::class, 'enabledFeatures']);
            Route::post('feature-flags/{feature}/toggle', [SettingController::class, 'toggleFeature']);

            // Get/Set by key (simplified endpoints)
            Route::get('key/{key}', [SettingController::class, 'getByKey'])->where('key', '.*');
            Route::post('key/{key}', [SettingController::class, 'setByKey'])->where('key', '.*');

            // Reset to default
            Route::post('{setting}/reset', [SettingController::class, 'reset']);
        });

        // Standard CRUD for settings
        Route::apiResource('settings', SettingController::class);

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

        // Products
        Route::apiResource('products', ProductController::class);
        Route::post('products/import', [ProductController::class, 'import']);
        Route::get('products-needing-reorder', [ProductController::class, 'needingReorder']);
        Route::get('products/{product}/composite-breakdown', [ProductController::class, 'compositeBreakdown']);
        Route::get('products/categories/list', [ProductController::class, 'categories']);
        Route::post('products/{product}/calculate-price', [ProductController::class, 'calculatePrice']);

        // Product Media
        Route::get('products/{product}/media', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'index']);
        Route::post('products/{product}/media', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'store']);
        Route::get('products/{product}/media/{media}', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'show']);
        Route::put('products/{product}/media/{media}', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'update']);
        Route::delete('products/{product}/media/{media}', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'destroy']);
        Route::post('products/{product}/media/{media}/reorder', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'reorder']);

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

        // Product Relation Types (configurable relation types)
        Route::apiResource('product-relation-types', ProductRelationTypeController::class);

        // Product Categories (NEW - replaces material-categories)
        Route::apiResource('product-categories', ProductCategoryController::class);

        // Product Brands
        Route::apiResource('product-brands', \App\Http\Controllers\Api\V1\ProductBrandController::class);

        // Payment Terms
        Route::apiResource('payment-terms', \App\Http\Controllers\Api\V1\PaymentTermController::class);

        // Discount Families
        Route::apiResource('discount-families', \App\Http\Controllers\Api\V1\DiscountFamilyController::class);

        // Price Lists
        Route::prefix('price-lists')->group(function () {
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

        // Product Unit Types
        Route::get('/unit-types', [ProductUnitTypeController::class, 'index']);
        Route::get('/unit-types/category/{category}', [ProductUnitTypeController::class, 'byCategory']);

        // Material Categories (DEPRECATED - use product-categories instead)
        Route::apiResource('material-categories', MaterialCategoryController::class);

        // Import Configuration
        Route::get('import/models', [ImportController::class, 'getAvailableModels']);
        Route::get('import/{model}/fields', [ImportController::class, 'getImportableFields']);
        Route::post('import/supplier-catalog', [ImportController::class, 'importSupplierCatalog']);

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

        // Site Roles (Ruoli Cantiere)
        Route::apiResource('site-roles', SiteRoleController::class);

        // DDT (Documento Di Trasporto)
        Route::get('ddts/next-number', [DdtController::class, 'getNextNumber']);
        Route::apiResource('ddts', DdtController::class);
        Route::post('ddts/{ddt}/confirm', [DdtController::class, 'confirm']);
        Route::post('ddts/{ddt}/cancel', [DdtController::class, 'cancel']);
        Route::post('ddts/{ddt}/mark-delivered', [DdtController::class, 'markAsDelivered']);
        Route::post('ddts/{ddt}/deliver', [DdtController::class, 'deliver']);

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

        // Worker Invitations
        Route::get('invitations', [InvitationController::class, 'index']);
        Route::post('invitations', [InvitationController::class, 'store']);
        Route::get('invitations/pending', [InvitationController::class, 'pending']);
        Route::post('invitations/{invitation}/resend', [InvitationController::class, 'resend']);
        Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy']);

        // Material Requests
        Route::get('sites/{site}/material-requests', [MaterialRequestController::class, 'indexBySite']);
        Route::get('sites/{site}/material-requests/pending-count', [MaterialRequestController::class, 'pendingCount']);
        Route::get('sites/{site}/material-requests/stats', [MaterialRequestController::class, 'stats']);
        Route::get('my-material-requests', [MaterialRequestController::class, 'myRequests']);
        Route::post('material-requests', [MaterialRequestController::class, 'store']);
        Route::get('material-requests/{material_request}', [MaterialRequestController::class, 'show']);
        Route::patch('material-requests/{material_request}', [MaterialRequestController::class, 'update']);
        Route::post('material-requests/{material_request}/approve', [MaterialRequestController::class, 'approve']);
        Route::post('material-requests/{material_request}/reject', [MaterialRequestController::class, 'reject']);
        Route::post('material-requests/{material_request}/mark-delivered', [MaterialRequestController::class, 'markDelivered']);
        Route::delete('material-requests/{material_request}', [MaterialRequestController::class, 'destroy']);

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);
        Route::delete('notifications/read/all', [NotificationController::class, 'deleteAllRead']);

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
