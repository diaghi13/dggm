<?php

declare(strict_types=1);

namespace App\Services;

use Symfony\Component\Mime\Part\DataPart;

class InlineImageProcessor
{
    /**
     * Parse HTML for local storage image URLs, replace with cid: references,
     * and return the modified HTML plus the DataParts to attach inline.
     *
     * @return array{html: string, parts: DataPart[]}
     */
    public function process(string $html): array
    {
        $parts = [];
        $index = 0;

        $processed = preg_replace_callback(
            '/<img([^>]*)\ssrc=["\']([^"\']+)["\']([^>]*)>/i',
            function (array $matches) use (&$parts, &$index): string {
                $src = $matches[2];
                $absolutePath = $this->resolveStoragePath($src);

                if ($absolutePath === null || ! file_exists($absolutePath)) {
                    return $matches[0]; // leave unchanged
                }

                $cid = 'sig_img_'.$index++.'@dggm';
                $mime = mime_content_type($absolutePath) ?: 'image/png';

                $part = (new DataPart(file_get_contents($absolutePath), basename($absolutePath), $mime))
                    ->asInline()
                    ->setContentId($cid);

                $parts[] = $part;

                return '<img'.$matches[1].' src="cid:'.$cid.'"'.$matches[3].'>';
            },
            $html
        );

        return ['html' => $processed ?? $html, 'parts' => $parts];
    }

    /**
     * Convert a storage URL or relative path to an absolute filesystem path.
     * Returns null for external URLs or unrecognised paths.
     */
    private function resolveStoragePath(string $src): ?string
    {
        $appUrl = rtrim(config('app.url'), '/');

        if (str_starts_with($src, $appUrl)) {
            $webPath = ltrim(substr($src, strlen($appUrl)), '/');
        } elseif (str_starts_with($src, 'http://') || str_starts_with($src, 'https://')) {
            return null; // external — leave as-is
        } else {
            $webPath = ltrim($src, '/');
        }

        if (! str_starts_with($webPath, 'storage/')) {
            return null;
        }

        return public_path($webPath);
    }
}
