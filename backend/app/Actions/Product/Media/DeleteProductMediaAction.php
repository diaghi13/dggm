<?php

namespace App\Actions\Product\Media;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Delete media file from product (permanent deletion)
 */
class DeleteProductMediaAction
{
    public function execute(Media $media): bool
    {
        return DB::transaction(function () use ($media) {
            // Cascade delete the PDF conversion if this is the original document
            if ($pdfMediaId = $media->getCustomProperty('pdf_media_id')) {
                $pdfMedia = Media::find($pdfMediaId);
                if ($pdfMedia) {
                    $pdfMedia->delete();
                    Log::info('Deleted PDF conversion with original document', [
                        'source_media_id' => $media->id,
                        'pdf_media_id' => $pdfMediaId,
                    ]);
                }
            }

            // Spatie Media Library handles file deletion automatically
            return $media->delete();
        });
    }
}
