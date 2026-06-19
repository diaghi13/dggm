<?php

use App\Http\Controllers\Api\V1\Materials\MaterialRequestController;
use App\Http\Controllers\Api\V1\Projects\ProjectDdtController;
use App\Http\Controllers\Api\V1\Projects\ProjectMaterialController;
use App\Http\Controllers\Api\V1\Rentals\RentalReturnInspectionController;
use App\Http\Controllers\Api\V1\Warehouses\DdtController;
use App\Http\Controllers\Api\V1\Warehouses\InventoryController;
use App\Http\Controllers\Api\V1\Warehouses\RepairOrderController;
use App\Http\Controllers\Api\V1\Warehouses\StockMovementController;
use App\Http\Controllers\Api\V1\Warehouses\WarehouseController;

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

    // Rental Return Inspections (Step 8)
    Route::post('ddts/{ddt}/inspection', [RentalReturnInspectionController::class, 'start']);
    Route::get('ddts/{ddt}/inspection', [RentalReturnInspectionController::class, 'show']);
    Route::patch('inspection-items/{item}', [RentalReturnInspectionController::class, 'completeItem']);
    Route::post('inspections/{inspection}/finalize', [RentalReturnInspectionController::class, 'finalize']);
    Route::get('inspections/pending', [RentalReturnInspectionController::class, 'pending']);

    // Repair Orders & Quarantine Management (Step 9)
    Route::get('inventory/quarantine', [RepairOrderController::class, 'quarantine']);
    Route::get('repair-orders', [RepairOrderController::class, 'index']);
    Route::post('repair-orders', [RepairOrderController::class, 'store']);
    Route::get('repair-orders/{repairOrder}', [RepairOrderController::class, 'show']);
    Route::put('repair-orders/{repairOrder}', [RepairOrderController::class, 'update']);
    Route::patch('repair-orders/{repairOrder}/status', [RepairOrderController::class, 'updateStatus']);
    Route::get('products/{product}/repair-history', [RepairOrderController::class, 'repairHistory']);

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
    Route::post('projects/{project}/materials/{projectMaterial}/subrental-assignments', [ProjectMaterialController::class, 'addSubrentalAssignment']);
    Route::patch('projects/{project}/materials/{projectMaterial}/subrental-assignments/{entryId}', [ProjectMaterialController::class, 'updateSubrentalAssignment']);
    Route::delete('projects/{project}/materials/{projectMaterial}/subrental-assignments/{entryId}', [ProjectMaterialController::class, 'removeSubrentalAssignment']);

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
