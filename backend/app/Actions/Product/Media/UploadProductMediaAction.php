<?php

namespace App\Actions\Product\Media;

use App\Data\ProductMediaData;
use App\Jobs\ConvertDocumentToPdfJob;
use App\Models\Product;
use App\Services\DocumentConverterService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Upload media file to a product with custom properties
 */
class UploadProductMediaAction
{
    public function execute(Product $product, UploadedFile $file, ProductMediaData $data): Media
    {
        return DB::transaction(function () use ($product, $file, $data) {
            // If this is marked as primary image, unmark all others
            if ($data->collection_name === 'images' && $data->is_primary) {
                $this->unmarkOtherPrimaryImages($product);
            }

            // Add media with custom properties
            $media = $product->addMedia($file)
                ->withCustomProperties($data->getCustomProperties())
                ->toMediaCollection($data->collection_name);

            // Set sort order if provided
            if (isset($data->sort_order) && ! ($data->sort_order instanceof \Spatie\LaravelData\Optional)) {
                $media->order_column = $data->sort_order;
                $media->save();
            }

            // Dispatch PDF conversion job for non-PDF documents (Word, Excel, etc.)
            if (app(DocumentConverterService::class)->needsConversion($media->mime_type)) {
                ConvertDocumentToPdfJob::dispatch($media->id);
            }

            return $media;
        });
    }

    /**
     * Unmark all other images as primary
     */
    private function unmarkOtherPrimaryImages(Product $product): void
    {
        $product->getMedia('images')->each(function (Media $media) {
            $customProperties = $media->custom_properties;
            $customProperties['is_primary'] = false;
            $media->custom_properties = $customProperties;
            $media->save();
        });
    }
}
