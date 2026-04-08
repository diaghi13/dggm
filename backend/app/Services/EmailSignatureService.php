<?php

namespace App\Services;

use App\Models\EmailAccount;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;

class EmailSignatureService
{
    public function __construct(
        private readonly SettingService $settings
    ) {}

    /**
     * Resolve the email signature with a three-level cascade:
     * 1. Specific EmailAccount signature
     * 2. User-specific global signature setting
     * 3. Global tenant signature setting
     *
     * Images in the HTML are converted to base64 data URLs so they
     * render correctly in email clients that block external images.
     */
    public function resolve(?int $emailAccountId = null, ?int $userId = null): ?string
    {
        // Level 1: account-specific signature
        if ($emailAccountId) {
            $account = EmailAccount::find($emailAccountId);
            if ($account?->signature) {
                return $this->embedImages($account->signature);
            }
        }

        // Level 2: user-specific signature
        if ($userId) {
            $userSignature = Setting::where('key', 'email.signature')
                ->where('user_id', $userId)
                ->value('value');
            if ($userSignature) {
                return $this->embedImages($userSignature);
            }
        }

        // Level 3: global tenant signature
        $global = $this->settings->get('email.signature');

        return $global ? $this->embedImages($global) : null;
    }

    /**
     * Replace <img src="URL"> with base64 data URLs for images stored
     * on the local filesystem, so they display in all email clients.
     */
    private function embedImages(string $html): string
    {
        return preg_replace_callback(
            '/<img([^>]*)\ssrc=["\']([^"\']+)["\']([^>]*)>/i',
            function (array $matches) {
                $src = $matches[2];
                $dataUrl = $this->resolveImageToDataUrl($src);

                if ($dataUrl === null) {
                    return $matches[0]; // leave unchanged if we can't embed
                }

                return '<img'.$matches[1].' src="'.$dataUrl.'"'.$matches[3].'>';
            },
            $html
        );
    }

    /**
     * Convert a storage URL or relative path to a base64 data URL.
     * Returns null if the file cannot be found on disk.
     */
    private function resolveImageToDataUrl(string $src): ?string
    {
        $appUrl = rtrim(config('app.url'), '/');

        // Strip the app URL prefix to get a relative web path
        if (str_starts_with($src, $appUrl)) {
            $webPath = ltrim(substr($src, strlen($appUrl)), '/');
        } elseif (str_starts_with($src, 'http://') || str_starts_with($src, 'https://')) {
            return null; // external URL, skip
        } else {
            $webPath = ltrim($src, '/');
        }

        // Map /storage/... to the actual filesystem path via the public disk
        if (str_starts_with($webPath, 'storage/')) {
            $relativePath = substr($webPath, strlen('storage/'));
            $absolutePath = Storage::disk('public')->path($relativePath);
        } else {
            return null;
        }

        if (! file_exists($absolutePath)) {
            return null;
        }

        $mime = mime_content_type($absolutePath) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode(file_get_contents($absolutePath));
    }
}
