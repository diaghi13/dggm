<?php

namespace App\Actions\Product\Media;

use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Update sort order for media items
 */
class ReorderProductMediaAction
{
    /**
     * Update the sort order for a media item
     *
     * @param  Media  $media  The media to reorder
     * @param  int  $newOrder  The new sort order
     */
    public function execute(Media $media, int $newOrder): Media
    {
        return DB::transaction(function () use ($media, $newOrder) {
            $media->order_column = $newOrder;
            $media->save();

            return $media->fresh();
        });
    }
}
