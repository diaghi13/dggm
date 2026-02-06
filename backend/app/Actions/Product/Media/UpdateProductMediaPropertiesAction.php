<?php

namespace App\Actions\Product\Media;

use App\Data\ProductMediaData;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Update custom properties of media (description, flags, order)
 */
class UpdateProductMediaPropertiesAction
{
    public function execute(Media $media, ProductMediaData $data): Media
    {
        return DB::transaction(function () use ($media, $data) {
            $product = $media->model;

            // If marking this as primary image, unmark all others
            if ($data->collection_name === 'images' && $data->is_primary && $product instanceof Product) {
                $this->unmarkOtherPrimaryImages($product, $media->id);
            }

            // Update custom properties
            $customProperties = array_merge(
                $media->custom_properties,
                $data->getCustomProperties()
            );

            $media->custom_properties = $customProperties;

            // Update sort order if provided
            if (isset($data->sort_order) && ! ($data->sort_order instanceof \Spatie\LaravelData\Optional)) {
                $media->order_column = $data->sort_order;
            }

            $media->save();

            return $media->fresh();
        });
    }

    /**
     * Unmark all other images as primary (except the current one)
     */
    private function unmarkOtherPrimaryImages(Product $product, int $currentMediaId): void
    {
        $product->getMedia('images')
            ->filter(fn (Media $media) => $media->id !== $currentMediaId)
            ->each(function (Media $media) {
                $customProperties = $media->custom_properties;
                $customProperties['is_primary'] = false;
                $media->custom_properties = $customProperties;
                $media->save();
            });
    }
}
