<?php

use App\Http\Controllers\Api\V1\Media\MediaController;
use App\Http\Controllers\Api\V1\Media\MediaUploadController;

Route::post('media/upload-image', [MediaUploadController::class, 'uploadImage']);
Route::post('media/{modelType}/{modelId}', [MediaController::class, 'upload']);
Route::get('media/{media}/download', [MediaController::class, 'download']);
Route::delete('media/{media}', [MediaController::class, 'destroy']);
