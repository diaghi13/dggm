<?php

declare(strict_types=1);

namespace App\Support\MediaLibrary;

use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

class TenantPathGenerator implements PathGenerator
{
    public function getPath(Media $media): string
    {
        return $this->getBasePath($media).'/';
    }

    public function getPathForConversions(Media $media): string
    {
        return $this->getBasePath($media).'/conversions/';
    }

    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->getBasePath($media).'/responsive-images/';
    }

    protected function getBasePath(Media $media): string
    {
        // tenant() returns null in central context (e.g., settings/company logo)
        $tenantId = tenant()?->getTenantKey();

        if ($tenantId) {
            return $tenantId.'/'.$media->getKey();
        }

        // Central context (landlord): use 'central' prefix
        return 'central/'.$media->getKey();
    }
}
