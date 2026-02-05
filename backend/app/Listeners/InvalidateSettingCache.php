<?php

namespace App\Listeners;

use App\Events\SettingCreated;
use App\Events\SettingDeleted;
use App\Events\SettingUpdated;
use Illuminate\Support\Facades\Cache;

class InvalidateSettingCache
{
    private const CACHE_PREFIX = 'setting:';

    /**
     * Handle SettingCreated event
     */
    public function handleCreated(SettingCreated $event): void
    {
        $this->invalidateCache($event->setting->key, $event->setting->user_id);
    }

    /**
     * Handle SettingUpdated event
     */
    public function handleUpdated(SettingUpdated $event): void
    {
        $this->invalidateCache($event->setting->key, $event->setting->user_id);
    }

    /**
     * Handle SettingDeleted event
     */
    public function handleDeleted(SettingDeleted $event): void
    {
        // Since we don't have access to user_id directly, we'll clear both global and user caches
        // This is a limitation - ideally we'd pass user_id in the event metadata
        $globalKey = $this->getCacheKey($event->settingKey, null);
        Cache::forget($globalKey);

        // Note: User-specific cache will need metadata from event
        if (isset($event->metadata['user_id'])) {
            $userKey = $this->getCacheKey($event->settingKey, $event->metadata['user_id']);
            Cache::forget($userKey);
        }
    }

    /**
     * Invalidate cache for a specific setting
     */
    private function invalidateCache(string $key, ?int $userId): void
    {
        $cacheKey = $this->getCacheKey($key, $userId);
        Cache::forget($cacheKey);
    }

    /**
     * Generate cache key
     */
    private function getCacheKey(string $key, ?int $userId): string
    {
        $userPart = $userId ? "user:{$userId}" : 'global';

        return self::CACHE_PREFIX."{$userPart}:{$key}";
    }
}
