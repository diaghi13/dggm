<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CodeController;
use App\Http\Controllers\Api\V1\ContractorController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DdtController;
use App\Http\Controllers\Api\V1\ImportController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\KitAssemblyController;
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
use App\Http\Controllers\Api\V1\ProductSubrentalSupplierController;
use App\Http\Controllers\Api\V1\ProductUnitTypeController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectDdtController;
use App\Http\Controllers\Api\V1\ProjectExpenseController;
use App\Http\Controllers\Api\V1\ProjectLaborCostController;
use App\Http\Controllers\Api\V1\ProjectLaborLogController;
use App\Http\Controllers\Api\V1\ProjectMaterialController;
use App\Http\Controllers\Api\V1\ProjectRoleController;
use App\Http\Controllers\Api\V1\ProjectWorkerController;
use App\Http\Controllers\Api\V1\ProjectWorkerScheduleController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\RentalAnalyticsController;
use App\Http\Controllers\Api\V1\RentalProfileController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\StockMovementController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\TenantInvitationController;
use App\Http\Controllers\Api\V1\WarehouseController;
use App\Http\Controllers\Api\V1\WorkerController;
use App\Http\Controllers\Auth\GlobalAuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Landlord\TenantManagementController;
use App\Http\Controllers\Worker\WorkerOverviewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Password reset web route (for email links)
Route::get('/password-reset/{token}', function ($token) {
    $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
    $email = request()->query('email');

    return redirect()->away("{$frontendUrl}/reset-password?token={$token}&email={$email}");
})->name('password.reset');

// Temporary route for tenancy context testing (used in TenancyBasicTest)
Route::get('/test-tenant-context', function () {
    return response()->json(['tenant' => tenancy()->tenant?->id]);
});

// API v1 routes
Route::prefix('v1')->group(function () {
    // Public routes (no authentication)
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout']); // public: must clear cookie even with invalid token
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    });

    // Company registration (public)
    Route::post('auth/register', [RegisterController::class, 'register']);
    Route::get('auth/tenant-status/{tenantId}', [RegisterController::class, 'tenantStatus']);

    // Global auth routes (landlord DB, cross-tenant token)
    // Login is public — no auth required
    Route::post('auth/global/login', [GlobalAuthController::class, 'login']);

    // Landlord Admin routes (only is_landlord_admin GlobalUsers)
    Route::prefix('landlord')->middleware(['auth:global', 'landlord.admin'])->group(function () {
        Route::get('tenants', [TenantManagementController::class, 'index']);
        Route::post('tenants', [TenantManagementController::class, 'store']);
        Route::get('tenants/{id}', [TenantManagementController::class, 'show']);
        Route::patch('tenants/{id}/activate', [TenantManagementController::class, 'activate']);
        Route::patch('tenants/{id}/suspend', [TenantManagementController::class, 'suspend']);
        Route::delete('tenants/{id}', [TenantManagementController::class, 'destroy']);

        Route::get('users', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'index']);
        Route::get('users/{id}', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'show']);
        Route::patch('users/{id}', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'update']);
        Route::post('users/{id}/toggle-admin', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'toggleAdmin']);
        Route::get('users/{id}/memberships', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'memberships']);
        Route::post('users/{id}/memberships', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'addMembership']);
        Route::delete('users/{userId}/memberships/{membershipId}', [\App\Http\Controllers\Landlord\GlobalUserController::class, 'removeMembership']);

        // Plans management (landlord admin)
        Route::prefix('plans')->group(function () {
            Route::get('/', [\App\Http\Controllers\Landlord\PlansController::class, 'adminIndex']);
            Route::post('/', [\App\Http\Controllers\Landlord\PlansController::class, 'store']);
            Route::get('{id}', [\App\Http\Controllers\Landlord\PlansController::class, 'show']);
            Route::put('{id}', [\App\Http\Controllers\Landlord\PlansController::class, 'update']);
            Route::delete('{id}', [\App\Http\Controllers\Landlord\PlansController::class, 'destroy']);
            Route::get('{id}/tenant-count', [\App\Http\Controllers\Landlord\PlansController::class, 'tenantCount']);
        });
    });

    // Plans — public (registration page needs to show plans before the user has a token)
    Route::get('plans', [\App\Http\Controllers\Landlord\PlansController::class, 'index']);

    // Authenticated global auth routes — require GlobalUser token (auth:global guard)
    // Also apply EnsureTenantMembership so that when an X-Tenant header is present,
    // the user's membership and subscription are verified.
    Route::prefix('auth/global')->middleware(['auth:global', 'tenant.member'])->group(function () {
        Route::get('/me', [GlobalAuthController::class, 'me']);
        Route::get('/tenants', [GlobalAuthController::class, 'tenants']);
        Route::post('/logout', [GlobalAuthController::class, 'logout']);
    });

    // Worker global view — landlord context, no x-tenant required.
    // InitializeTenancyByRequestData::$onFail is configured as a no-op in AppServiceProvider,
    // so these routes work without the x-tenant header.
    Route::prefix('my')->middleware(['auth:global'])->group(function () {
        Route::get('overview', [WorkerOverviewController::class, 'overview']);
        Route::get('projects', [WorkerOverviewController::class, 'projects']);
        Route::get('profile', [WorkerOverviewController::class, 'profile']);
        Route::patch('profile', [WorkerOverviewController::class, 'updateProfile']);
    });

    // Public invitation routes (no authentication)
    Route::get('invitations/{token}', [InvitationController::class, 'showByToken']);
    Route::post('invitations/{token}/accept', [InvitationController::class, 'accept']);

    // Tenant invitations — public (no auth required to preview/accept)
    Route::post('tenant-invitations/accept', [TenantInvitationController::class, 'accept']);
    Route::get('tenant-invitations/preview/{token}', [TenantInvitationController::class, 'preview']);

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth routes
        Route::prefix('auth')->group(function () {
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
            Route::get('types', [SettingController::class, 'types']);
            Route::get('grouped', [SettingController::class, 'grouped']);

            // Feature Flags
            Route::get('feature-flags', [SettingController::class, 'featureFlags']);
            Route::get('feature-flags/enabled', [SettingController::class, 'enabledFeatures']);
            Route::post('feature-flags/{feature}/toggle', [SettingController::class, 'toggleFeature']);

            // Batch update multiple settings in one request
            Route::post('batch', [SettingController::class, 'batchUpdate']);

            // Get/Set by key (simplified endpoints)
            Route::get('key/{key}', [SettingController::class, 'getByKey'])->where('key', '.*');
            Route::post('key/{key}', [SettingController::class, 'setByKey'])->where('key', '.*');

            // Company Logo
            Route::post('company/logo', [SettingController::class, 'uploadCompanyLogo']);
            Route::delete('company/logo', [SettingController::class, 'deleteCompanyLogo']);

            // Company Images (stamp, signature)
            Route::post('company/image/{type}', [SettingController::class, 'uploadCompanyImage']);
            Route::delete('company/image/{type}', [SettingController::class, 'deleteCompanyImage']);

            // Reset to default
            Route::post('{setting}/reset', [SettingController::class, 'reset']);
        });

        // Standard CRUD for settings
        Route::apiResource('settings', SettingController::class);

        // Code generation (progressive codes for entities)
        Route::get('codes/generate/{entity}', [CodeController::class, 'generate']);

        // Customers
        Route::apiResource('customers', CustomerController::class);

        // Projects (replaces Sites)
        Route::apiResource('projects', ProjectController::class);

        // Suppliers
        Route::apiResource('suppliers', SupplierController::class);
        Route::get('suppliers/{supplier}/workers', [SupplierController::class, 'getWorkers']);
        Route::get('suppliers/{supplier}/rates', [SupplierController::class, 'getRates']);
        Route::get('suppliers/{supplier}/statistics', [SupplierController::class, 'getStatistics']);

        // Quotes
        Route::apiResource('quotes', QuoteController::class);

        // Quote Status Management
        Route::patch('quotes/{quote}/status', [QuoteController::class, 'changeStatus']);
        Route::post('quotes/{quote}/approve', [QuoteController::class, 'approve']);
        Route::post('quotes/{quote}/reject', [QuoteController::class, 'reject']);
        Route::post('quotes/{quote}/send', [QuoteController::class, 'send']);

        // Quote Actions
        Route::post('quotes/{quote}/convert-to-project', [QuoteController::class, 'convertToProject']);
        Route::post('quotes/{quote}/save-pdf', [QuoteController::class, 'savePdf']);

        // Quote PDF
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

        // Product Suppliers (pivot pricing data)
        Route::get('products/{product}/suppliers', [ProductController::class, 'suppliers']);

        // Product Media
        Route::get('products/{product}/media', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'index']);
        Route::post('products/{product}/media', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'store']);
        Route::get('products/{product}/media/download-zip', [\App\Http\Controllers\Api\V1\ProductMediaController::class, 'downloadCollectionZip']);
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
        Route::apiResource('product-brands', \App\Http\Controllers\Api\V1\ProductBrandController::class);

        // Payment Terms
        Route::apiResource('payment-terms', \App\Http\Controllers\Api\V1\PaymentTermController::class);

        // Financial Resources (company bank accounts, cash registers, cards)
        Route::prefix('financial-resources')->group(function () {
            Route::get('active', [\App\Http\Controllers\Api\V1\FinancialResourceController::class, 'getActive']);
            Route::get('defaults', [\App\Http\Controllers\Api\V1\FinancialResourceController::class, 'getDefaults']);
        });
        Route::apiResource('financial-resources', \App\Http\Controllers\Api\V1\FinancialResourceController::class);

        // Discount Families
        Route::apiResource('discount-families', \App\Http\Controllers\Api\V1\DiscountFamilyController::class);

        // Warranty Types
        Route::get('warranty-types/default', [\App\Http\Controllers\Api\V1\WarrantyTypeController::class, 'getDefault']);
        Route::apiResource('warranty-types', \App\Http\Controllers\Api\V1\WarrantyTypeController::class);

        // Rental module — requires feature:rental
        Route::middleware('feature:rental')->group(function () {
            // Rental Profiles (sector presets for RentalEngineService)
            Route::apiResource('rental-profiles', RentalProfileController::class);
            Route::post('rental-profiles/{rentalProfile}/recalculate', [RentalProfileController::class, 'recalculate']);

            // Rental Analytics (KPIs: break-even, buy-vs-rent, ROI, underperformers, scarcity)
            Route::get('rental-analytics', [RentalAnalyticsController::class, 'index']);

            // Price Lists
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

        // Warehouse module — requires feature:warehouse
        Route::middleware('feature:warehouse')->group(function () {
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
            Route::post('stock-movements/deliver-to-project', [StockMovementController::class, 'deliverToProject']);
            Route::post('stock-movements/return-from-project', [StockMovementController::class, 'returnFromProject']);

            // DDT (Documento Di Trasporto)
            Route::get('ddts/next-number', [DdtController::class, 'getNextNumber']);
            Route::apiResource('ddts', DdtController::class);
            Route::post('ddts/{ddt}/confirm', [DdtController::class, 'confirm']);
            Route::post('ddts/{ddt}/cancel', [DdtController::class, 'cancel']);
            Route::post('ddts/{ddt}/mark-delivered', [DdtController::class, 'markAsDelivered']);
            Route::post('ddts/{ddt}/deliver', [DdtController::class, 'deliver']);

            // Project DDTs
            Route::get('projects/{project}/ddts', [ProjectDdtController::class, 'index']);
            Route::post('projects/{project}/ddts/{ddt}/confirm', [ProjectDdtController::class, 'confirm']);
            Route::post('projects/{project}/ddts/confirm-multiple', [ProjectDdtController::class, 'confirmMultiple']);

            // Project Materials (linked to warehouse operations)
            Route::get('projects/{project}/materials', [ProjectMaterialController::class, 'index']);
            Route::get('projects/{project}/materials/extras', [ProjectMaterialController::class, 'extras']);
            Route::post('projects/{project}/materials', [ProjectMaterialController::class, 'store']);
            Route::patch('projects/{project}/materials/{projectMaterial}', [ProjectMaterialController::class, 'update']);
            Route::delete('projects/{project}/materials/{projectMaterial}', [ProjectMaterialController::class, 'destroy']);
            Route::post('projects/{project}/materials/{projectMaterial}/log-usage', [ProjectMaterialController::class, 'logUsage']);
            Route::post('projects/{project}/materials/{projectMaterial}/reserve', [ProjectMaterialController::class, 'reserve']);
            Route::post('projects/{project}/materials/{projectMaterial}/deliver', [ProjectMaterialController::class, 'deliver']);
            Route::post('projects/{project}/materials/{projectMaterial}/return', [ProjectMaterialController::class, 'returnMaterial']);
            Route::post('projects/{project}/materials/{projectMaterial}/transfer', [ProjectMaterialController::class, 'transferToProject']);

            // Material Requests
            Route::get('projects/{project}/material-requests', [MaterialRequestController::class, 'indexByProject']);
            Route::get('projects/{project}/material-requests/pending-count', [MaterialRequestController::class, 'pendingCount']);
            Route::get('projects/{project}/material-requests/stats', [MaterialRequestController::class, 'stats']);
            Route::get('my-material-requests', [MaterialRequestController::class, 'myRequests']);
            Route::post('material-requests', [MaterialRequestController::class, 'store']);
            Route::get('material-requests/{material_request}', [MaterialRequestController::class, 'show']);
            Route::patch('material-requests/{material_request}', [MaterialRequestController::class, 'update']);
            Route::post('material-requests/{material_request}/approve', [MaterialRequestController::class, 'approve']);
            Route::post('material-requests/{material_request}/reject', [MaterialRequestController::class, 'reject']);
            Route::post('material-requests/{material_request}/mark-delivered', [MaterialRequestController::class, 'markDelivered']);
            Route::delete('material-requests/{material_request}', [MaterialRequestController::class, 'destroy']);
        });

        // Workers module — requires feature:workers
        Route::middleware('feature:workers')->group(function () {
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

            // Worker Projects
            Route::get('workers/{worker}/projects', [\App\Http\Controllers\Api\V1\WorkerProjectController::class, 'index']);
            Route::post('workers/{worker}/projects', [\App\Http\Controllers\Api\V1\WorkerProjectController::class, 'store']);
            Route::delete('workers/{worker}/projects/{project}', [\App\Http\Controllers\Api\V1\WorkerProjectController::class, 'destroy']);
            Route::get('workers/{worker}/projects/{project}/statistics', [\App\Http\Controllers\Api\V1\WorkerProjectController::class, 'statistics']);

            // Project Workers (Team Management)
            Route::get('projects/{project}/workers', [ProjectWorkerController::class, 'indexByProject']);
            Route::post('projects/{project}/workers', [ProjectWorkerController::class, 'store']);
            Route::get('workers/{worker}/projects', [ProjectWorkerController::class, 'indexByWorker']);
            Route::get('project-workers/{project_worker}', [ProjectWorkerController::class, 'show']);
            Route::put('project-workers/{project_worker}', [ProjectWorkerController::class, 'update']);
            Route::delete('project-workers/{project_worker}', [ProjectWorkerController::class, 'destroy']);
            Route::post('project-workers/{project_worker}/accept', [ProjectWorkerController::class, 'accept']);
            Route::post('project-workers/{project_worker}/reject', [ProjectWorkerController::class, 'reject']);
            Route::post('project-workers/{project_worker}/change-status', [ProjectWorkerController::class, 'changeStatus']);
            Route::post('project-workers/{project_worker}/cancel', [ProjectWorkerController::class, 'cancel']);
            Route::post('project-workers/{project_worker}/complete', [ProjectWorkerController::class, 'complete']);
            Route::get('project-workers/{project_worker}/conflicts', [ProjectWorkerController::class, 'checkConflicts']);
            Route::get('project-workers/{project_worker}/effective-rate', [ProjectWorkerController::class, 'getEffectiveRate']);

            // Project Worker Schedules
            Route::get('project-workers/{projectWorker}/schedules', [ProjectWorkerScheduleController::class, 'index']);
            Route::post('project-workers/{projectWorker}/schedules', [ProjectWorkerScheduleController::class, 'store']);
            Route::post('project-workers/{projectWorker}/assign-slot', [ProjectWorkerController::class, 'assignSlot']);
            Route::get('project-worker-schedules/{projectWorkerSchedule}', [ProjectWorkerScheduleController::class, 'show']);
            Route::put('project-worker-schedules/{projectWorkerSchedule}', [ProjectWorkerScheduleController::class, 'update']);
            Route::delete('project-worker-schedules/{projectWorkerSchedule}', [ProjectWorkerScheduleController::class, 'destroy']);
            Route::post('project-worker-schedules/{projectWorkerSchedule}/accept', [ProjectWorkerScheduleController::class, 'accept']);
            Route::post('project-worker-schedules/{projectWorkerSchedule}/reject', [ProjectWorkerScheduleController::class, 'reject']);

            // Project Labor Logs
            Route::get('projects/{project}/labor-logs', [ProjectLaborLogController::class, 'index']);
            Route::post('project-workers/{projectWorker}/labor-logs', [ProjectLaborLogController::class, 'store']);
            Route::get('project-labor-logs/{projectLaborLog}', [ProjectLaborLogController::class, 'show']);
            Route::post('project-labor-logs/{projectLaborLog}/approve', [ProjectLaborLogController::class, 'approve']);
            Route::post('project-labor-logs/{projectLaborLog}/reject', [ProjectLaborLogController::class, 'reject']);

            // Project Expenses
            Route::get('projects/{project}/expenses', [ProjectExpenseController::class, 'index']);
            Route::post('projects/{project}/expenses', [ProjectExpenseController::class, 'store']);
            Route::get('project-expenses/{projectExpense}', [ProjectExpenseController::class, 'show']);
            Route::put('project-expenses/{projectExpense}', [ProjectExpenseController::class, 'update']);
            Route::delete('project-expenses/{projectExpense}', [ProjectExpenseController::class, 'destroy']);
            Route::post('project-expenses/{projectExpense}/approve', [ProjectExpenseController::class, 'approve']);
            Route::post('project-expenses/{projectExpense}/reject', [ProjectExpenseController::class, 'reject']);

            // Final Balance
            Route::get('projects/{project}/final-balance', [ProjectController::class, 'finalBalance']);

            // Project Roles
            Route::apiResource('project-roles', ProjectRoleController::class);

            // Project Labor Costs
            Route::get('projects/{project}/labor-costs', [ProjectLaborCostController::class, 'index']);
            Route::post('projects/{project}/labor-costs', [ProjectLaborCostController::class, 'store']);
            Route::put('projects/{project}/labor-costs/{laborCost}', [ProjectLaborCostController::class, 'update']);
            Route::delete('projects/{project}/labor-costs/{laborCost}', [ProjectLaborCostController::class, 'destroy']);
            Route::get('projects/{project}/labor-costs/breakdown', [ProjectLaborCostController::class, 'breakdown']);
            Route::get('projects/{project}/labor-costs/monthly', [ProjectLaborCostController::class, 'monthly']);
            Route::get('projects/{project}/labor-costs/by-worker', [ProjectLaborCostController::class, 'byWorker']);
        });

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);
        Route::delete('notifications/read/all', [NotificationController::class, 'deleteAllRead']);

        // Contractors (Cooperative/Ditte Esterne)
        Route::apiResource('contractors', ContractorController::class);
        Route::get('contractors/{contractor}/statistics', [ContractorController::class, 'statistics']);
        Route::get('contractors/{contractor}/pending-invoices', [ContractorController::class, 'pendingInvoices']);

        // Contractor Rates
        Route::get('contractors/{contractor}/rates', [\App\Http\Controllers\Api\V1\ContractorRateController::class, 'index']);
        Route::get('contractors/{contractor}/rates/current', [\App\Http\Controllers\Api\V1\ContractorRateController::class, 'current']);
        Route::post('contractors/{contractor}/rates', [\App\Http\Controllers\Api\V1\ContractorRateController::class, 'store']);
        Route::get('contractors/{contractor}/rates/history', [\App\Http\Controllers\Api\V1\ContractorRateController::class, 'history']);

        // Tenant invitations — authenticated (admin invites a user to this tenant)
        Route::post('tenant-invitations', [TenantInvitationController::class, 'invite']);
    });
});
