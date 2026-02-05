<?php

namespace App\Services;

use App\Models\Setting;
use App\Queries\Setting\GetSettingByKeyQuery;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    private const CACHE_PREFIX = 'setting:';

    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Get setting value by key (with cache)
     */
    public function get(string $key, mixed $default = null, ?int $userId = null): mixed
    {
        $cacheKey = $this->getCacheKey($key, $userId);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($key, $userId, $default) {
            $setting = app(GetSettingByKeyQuery::class, [
                'key' => $key,
                'userId' => $userId,
            ])->execute();

            return $setting ? $setting->getTypedValue() : $default;
        });
    }

    /**
     * Set setting value by key (creates or updates)
     */
    public function set(string $key, mixed $value, ?int $userId = null, ?string $group = null, bool $isPublic = false): Setting
    {
        $setting = app(GetSettingByKeyQuery::class, [
            'key' => $key,
            'userId' => $userId,
        ])->execute();

        if ($setting) {
            // Update existing - preserve the type and convert value accordingly
            $existingType = $setting->type;

            // Convert value based on existing type
            switch ($existingType) {
                case 'boolean':
                    // Handle string representations of boolean
                    if (is_string($value)) {
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    }
                    $setting->value = $value ? '1' : '0';
                    break;

                case 'number':
                    $setting->value = (string) $value;
                    break;

                case 'json':
                    $setting->value = is_string($value) ? $value : json_encode($value);
                    break;

                case 'email':
                case 'url':
                case 'color':
                case 'date':
                case 'datetime':
                case 'file':
                case 'enum':
                case 'string':
                default:
                    $setting->value = (string) $value;
                    break;
            }

            if ($group !== null) {
                $setting->group = $group;
            }
            $setting->is_public = $isPublic;
            $setting->save();
        } else {
            // Create new
            $setting = new Setting;
            $setting->key = $key;
            $setting->setTypedValue($value);
            $setting->group = $group;
            $setting->user_id = $userId;
            $setting->is_public = $isPublic;
            $setting->save();
        }

        // Invalidate cache
        $this->forget($key, $userId);

        return $setting;
    }

    /**
     * Check if setting exists
     */
    public function has(string $key, ?int $userId = null): bool
    {
        $setting = app(GetSettingByKeyQuery::class, [
            'key' => $key,
            'userId' => $userId,
        ])->execute();

        return $setting !== null;
    }

    /**
     * Invalidate cache for a setting key
     */
    public function forget(string $key, ?int $userId = null): void
    {
        $cacheKey = $this->getCacheKey($key, $userId);
        Cache::forget($cacheKey);
    }

    /**
     * Delete setting by key (from database)
     */
    public function delete(string $key, ?int $userId = null): bool
    {
        // Invalidate cache first
        $this->forget($key, $userId);

        $setting = app(GetSettingByKeyQuery::class, [
            'key' => $key,
            'userId' => $userId,
        ])->execute();

        return $setting ? $setting->delete() : false;
    }

    /**
     * Clear all settings cache
     */
    public function clearCache(): void
    {
        // This would require tracking all keys or using tags (Redis only)
        // For simplicity, we'll implement per-key invalidation via Events
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
