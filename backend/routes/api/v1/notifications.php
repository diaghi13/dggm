<?php

use App\Http\Controllers\Api\V1\NotificationController;

Route::get('notifications', [NotificationController::class, 'index']);
Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
Route::post('notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);
Route::delete('notifications/read/all', [NotificationController::class, 'deleteAllRead']);
