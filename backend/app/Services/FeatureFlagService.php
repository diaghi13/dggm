<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class FeatureFlagService
{
    private const CACHE_PREFIX = 'feature_flag:';

    private const CACHE_TTL = 3600; // 1 hour

    private const ALL_FLAGS_CACHE_KEY = 'feature_flags:all';

    public function __construct(
        private readonly SettingService $settingService
    ) {}

    /**
     * Check if a feature is enabled
     */
    public function isEnabled(string $feature, ?int $userId = null): bool
    {
        $cacheKey = $this->getCacheKey($feature, $userId);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($feature, $userId) {
            $value = $this->settingService->get("features.{$feature}", false, $userId);

            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        });
    }

    /**
     * Check if a feature is disabled
     */
    public function isDisabled(string $feature, ?int $userId = null): bool
    {
        return ! $this->isEnabled($feature, $userId);
    }

    /**
     * Enable a feature
     */
    public function enable(string $feature, ?int $userId = null): Setting
    {
        $this->forgetCache($feature, $userId);

        return $this->settingService->set("features.{$feature}", true, $userId, 'features', false);
    }

    /**
     * Disable a feature
     */
    public function disable(string $feature, ?int $userId = null): Setting
    {
        $this->forgetCache($feature, $userId);

        return $this->settingService->set("features.{$feature}", false, $userId, 'features', false);
    }

    /**
     * Toggle a feature
     */
    public function toggle(string $feature, ?int $userId = null): Setting
    {
        $enabled = $this->isEnabled($feature, $userId);
        $this->forgetCache($feature, $userId);

        return $this->settingService->set("features.{$feature}", ! $enabled, $userId, 'features', false);
    }

    /**
     * Get all feature flags
     */
    public function all(?int $userId = null): Collection
    {
        $cacheKey = self::ALL_FLAGS_CACHE_KEY.($userId ? ":{$userId}" : ':global');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($userId) {
            $query = Setting::where('is_feature_flag', true)
                ->where('group', 'features')
                ->ordered();

            if ($userId === null) {
                $query->global();
            } else {
                $query->forUser($userId);
            }

            return $query->get();
        });
    }

    /**
     * Get all enabled features
     */
    public function enabled(?int $userId = null): Collection
    {
        return $this->all($userId)->filter(function (Setting $setting) {
            $value = $setting->getTypedValue();

            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        });
    }

    /**
     * Get all disabled features
     */
    public function disabled(?int $userId = null): Collection
    {
        return $this->all($userId)->filter(function (Setting $setting) {
            $value = $setting->getTypedValue();

            return ! filter_var($value, FILTER_VALIDATE_BOOLEAN);
        });
    }

    /**
     * When helper - execute callback if feature is enabled
     */
    public function when(string $feature, callable $callback, ?callable $default = null, ?int $userId = null): mixed
    {
        if ($this->isEnabled($feature, $userId)) {
            return $callback();
        }

        return $default ? $default() : null;
    }

    /**
     * Unless helper - execute callback if feature is disabled
     */
    public function unless(string $feature, callable $callback, ?callable $default = null, ?int $userId = null): mixed
    {
        if ($this->isDisabled($feature, $userId)) {
            return $callback();
        }

        return $default ? $default() : null;
    }

    /**
     * Clear feature flag cache
     */
    private function forgetCache(string $feature, ?int $userId): void
    {
        $cacheKey = $this->getCacheKey($feature, $userId);
        Cache::forget($cacheKey);

        // Also clear all flags cache
        Cache::forget(self::ALL_FLAGS_CACHE_KEY.($userId ? ":{$userId}" : ':global'));
    }

    /**
     * Generate cache key
     */
    private function getCacheKey(string $feature, ?int $userId): string
    {
        $userPart = $userId ? "user:{$userId}" : 'global';

        return self::CACHE_PREFIX."{$userPart}:{$feature}";
    }
}
