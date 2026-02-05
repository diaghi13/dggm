<?php

use App\Services\FeatureFlagService;

if (! function_exists('feature')) {
    /**
     * Check if a feature is enabled
     */
    function feature(string $feature, ?int $userId = null): bool
    {
        return app(FeatureFlagService::class)->isEnabled($feature, $userId);
    }
}

if (! function_exists('feature_when')) {
    /**
     * Execute callback if feature is enabled
     */
    function feature_when(string $feature, callable $callback, ?callable $default = null, ?int $userId = null): mixed
    {
        return app(FeatureFlagService::class)->when($feature, $callback, $default, $userId);
    }
}

if (! function_exists('feature_unless')) {
    /**
     * Execute callback if feature is disabled
     */
    function feature_unless(string $feature, callable $callback, ?callable $default = null, ?int $userId = null): mixed
    {
        return app(FeatureFlagService::class)->unless($feature, $callback, $default, $userId);
    }
}
