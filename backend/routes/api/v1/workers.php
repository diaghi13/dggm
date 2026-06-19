<?php

use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\Projects\ProjectController;
use App\Http\Controllers\Api\V1\Projects\ProjectExpenseController;
use App\Http\Controllers\Api\V1\Projects\ProjectLaborCostController;
use App\Http\Controllers\Api\V1\Projects\ProjectLaborLogController;
use App\Http\Controllers\Api\V1\Projects\ProjectRoleController;
use App\Http\Controllers\Api\V1\Projects\ProjectWorkerController;
use App\Http\Controllers\Api\V1\Projects\ProjectWorkerScheduleController;
use App\Http\Controllers\Api\V1\Workers\WorkerController;
use App\Http\Controllers\Api\V1\Workers\WorkerProjectController;
use App\Http\Controllers\Api\V1\Workers\WorkerRateController;

Route::middleware('feature:workers')->group(function () {
    // Workers (Collaboratori)
    Route::apiResource('workers', WorkerController::class);
    Route::post('workers/{worker}/deactivate', [WorkerController::class, 'deactivate']);
    Route::post('workers/{worker}/reactivate', [WorkerController::class, 'reactivate']);
    Route::get('workers/{worker}/statistics', [WorkerController::class, 'statistics']);
    Route::get('workers/available/list', [WorkerController::class, 'available']);

    // Worker Rates
    Route::get('workers/{worker}/rates', [WorkerRateController::class, 'index']);
    Route::get('workers/{worker}/rates/current', [WorkerRateController::class, 'current']);
    Route::post('workers/{worker}/rates', [WorkerRateController::class, 'store']);
    Route::delete('workers/{worker}/rates/{rate}', [WorkerRateController::class, 'destroy']);
    Route::get('workers/{worker}/rates/history', [WorkerRateController::class, 'history']);
    Route::post('workers/{worker}/rates/calculate', [WorkerRateController::class, 'calculate']);

    // Worker Invitations
    Route::get('invitations', [InvitationController::class, 'index']);
    Route::post('invitations', [InvitationController::class, 'store']);
    Route::get('invitations/pending', [InvitationController::class, 'pending']);
    Route::post('invitations/{invitation}/resend', [InvitationController::class, 'resend']);
    Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy']);

    // Worker Projects
    Route::get('workers/{worker}/projects', [WorkerProjectController::class, 'index']);
    Route::post('workers/{worker}/projects', [WorkerProjectController::class, 'store']);
    Route::delete('workers/{worker}/projects/{project}', [WorkerProjectController::class, 'destroy']);
    Route::get('workers/{worker}/projects/{project}/statistics', [WorkerProjectController::class, 'statistics']);

    // Project Workers (Team Management)
    Route::get('projects/{project}/workers', [ProjectWorkerController::class, 'indexByProject']);
    Route::post('projects/{project}/workers/slot', [ProjectWorkerController::class, 'storeSlot']);
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
    Route::post('project-workers/{project_worker}/resend-invite', [ProjectWorkerController::class, 'resendInvite']);

    // Project Worker Schedules
    Route::get('project-workers/{projectWorker}/schedules', [ProjectWorkerScheduleController::class, 'index']);
    Route::post('project-workers/{projectWorker}/schedules', [ProjectWorkerScheduleController::class, 'store']);
    Route::post('project-workers/{projectWorker}/generate-schedule', [ProjectWorkerScheduleController::class, 'generateSchedule']);
    Route::delete('project-workers/{projectWorker}/schedules', [ProjectWorkerScheduleController::class, 'destroyAll']);
    Route::get('projects/{project}/schedules', [ProjectController::class, 'workerSchedules']);
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
    Route::put('project-labor-logs/{projectLaborLog}', [ProjectLaborLogController::class, 'update']);
    Route::delete('project-labor-logs/{projectLaborLog}', [ProjectLaborLogController::class, 'destroy']);
    Route::post('project-labor-logs/{projectLaborLog}/approve', [ProjectLaborLogController::class, 'approve']);
    Route::post('project-labor-logs/{projectLaborLog}/reject', [ProjectLaborLogController::class, 'reject']);
    Route::post('project-labor-logs/{projectLaborLog}/change-status', [ProjectLaborLogController::class, 'changeStatus']);

    // Project Expenses
    Route::get('projects/{project}/expenses', [ProjectExpenseController::class, 'index']);
    Route::post('projects/{project}/expenses', [ProjectExpenseController::class, 'store']);
    Route::get('project-expenses/{projectExpense}', [ProjectExpenseController::class, 'show']);
    Route::put('project-expenses/{projectExpense}', [ProjectExpenseController::class, 'update']);
    Route::delete('project-expenses/{projectExpense}', [ProjectExpenseController::class, 'destroy']);
    Route::post('project-expenses/{projectExpense}/approve', [ProjectExpenseController::class, 'approve']);
    Route::post('project-expenses/{projectExpense}/reject', [ProjectExpenseController::class, 'reject']);
    Route::post('project-expenses/{projectExpense}/receipt', [ProjectExpenseController::class, 'uploadReceipt']);
    Route::delete('project-expenses/{projectExpense}/receipt', [ProjectExpenseController::class, 'deleteReceipt']);

    // Final Balance
    Route::get('projects/{project}/final-balance', [ProjectController::class, 'finalBalance']);

    // Project Stock
    Route::get('projects/{project}/stock', [ProjectController::class, 'projectStock']);
    Route::get('projects/{project}/stock-summary', [ProjectController::class, 'stockSummary']);
    Route::get('projects/{project}/order-list', [ProjectController::class, 'orderList']);

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
