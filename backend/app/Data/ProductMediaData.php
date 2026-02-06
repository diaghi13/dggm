<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Product Media Data Transfer Object
 *
 * Handles media upload, update, and transformation for products
 */
class ProductMediaData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[In(['images', 'technical_sheets', 'certifications', 'manuals', 'drawings', 'documents'])]
        public string $collection_name,

        public string|Optional $file_name,

        public string|Optional $mime_type,

        public int|Optional $size,

        public string|Optional $url,

        public string|Optional $thumb_url,

        public string|Optional $medium_url,

        #[Max(500)]
        public ?string $description,

        // Image-specific flags
        public bool|Optional $is_primary,
        public bool|Optional $use_in_quotes,
        public bool|Optional $use_in_projects,

        // Document-specific properties
        public ?string $document_type,
        public ?string $valid_until,

        public int|Optional $sort_order,

        public string|Optional $created_at,
    ) {}

    /**
     * Create ProductMediaData from Media model
     */
    public static function fromMedia(Media $media): self
    {
        $customProperties = $media->custom_properties;

        // Fix URL to use current request host/port instead of APP_URL
        $url = self::fixMediaUrl($media->getUrl());
        $thumbUrl = $media->hasGeneratedConversion('thumb') ? self::fixMediaUrl($media->getUrl('thumb')) : null;
        $mediumUrl = $media->hasGeneratedConversion('medium') ? self::fixMediaUrl($media->getUrl('medium')) : null;

        return new self(
            id: $media->id,
            collection_name: $media->collection_name,
            file_name: $media->file_name,
            mime_type: $media->mime_type,
            size: $media->size,
            url: $url,
            thumb_url: $thumbUrl,
            medium_url: $mediumUrl,
            description: $customProperties['description'] ?? null,
            is_primary: $customProperties['is_primary'] ?? false,
            use_in_quotes: $customProperties['use_in_quotes'] ?? false,
            use_in_projects: $customProperties['use_in_projects'] ?? false,
            document_type: $customProperties['document_type'] ?? null,
            valid_until: $customProperties['valid_until'] ?? null,
            sort_order: $media->order_column ?? 0,
            created_at: $media->created_at?->toISOString() ?? '',
        );
    }

    /**
     * Fix media URL to use current request host/port instead of APP_URL
     * This ensures URLs work correctly when server runs on different port
     */
    private static function fixMediaUrl(string $url): string
    {
        if (! request()) {
            return $url;
        }

        $appUrl = parse_url(config('app.url'));
        $requestUrl = parse_url(request()->url());

        // Replace APP_URL host:port with actual request host:port
        $currentHost = ($requestUrl['scheme'] ?? 'http').'://'.
            ($requestUrl['host'] ?? 'localhost').
            (isset($requestUrl['port']) ? ':'.$requestUrl['port'] : '');

        $configHost = ($appUrl['scheme'] ?? 'http').'://'.
            ($appUrl['host'] ?? 'localhost').
            (isset($appUrl['port']) ? ':'.$appUrl['port'] : '');

        return str_replace($configHost, $currentHost, $url);
    }

    /**
     * Get custom properties array for Spatie Media Library
     */
    public function getCustomProperties(): array
    {
        $properties = [
            'description' => $this->description,
            'sort_order' => $this->sort_order,
        ];

        // Add image-specific properties
        if ($this->collection_name === 'images') {
            $properties['is_primary'] = $this->is_primary;
            $properties['use_in_quotes'] = $this->use_in_quotes;
            $properties['use_in_projects'] = $this->use_in_projects;
        }

        // Add document-specific properties
        if (in_array($this->collection_name, ['technical_sheets', 'certifications', 'manuals', 'drawings', 'documents'])) {
            $properties['document_type'] = $this->document_type;
            $properties['valid_until'] = $this->valid_until;
        }

        // Filter out null values
        return array_filter($properties, fn ($value) => $value !== null);
    }

    /**
     * Validation messages
     */
    public static function messages(): array
    {
        return [
            'collection_name.required' => 'La collezione è obbligatoria.',
            'collection_name.in' => 'La collezione deve essere una tra: images, technical_sheets, certifications, manuals, drawings, documents.',
            'description.max' => 'La descrizione non può superare 500 caratteri.',
        ];
    }
}
