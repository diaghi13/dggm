<?php

namespace App\Actions\Product\Media;

use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Delete media file from product (permanent deletion)
 */
class DeleteProductMediaAction
{
    public function execute(Media $media): bool
    {
        return DB::transaction(function () use ($media) {
            // Spatie Media Library handles file deletion automatically
            return $media->delete();
        });
    }
}
