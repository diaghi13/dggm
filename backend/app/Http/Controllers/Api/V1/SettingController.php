<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Setting\CreateSettingAction;
use App\Actions\Setting\DeleteSettingAction;
use App\Actions\Setting\UpdateSettingAction;
use App\Data\SettingData;
use App\Enums\SettingType;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Queries\Setting\GetAllSettingsQuery;
use App\Services\FeatureFlagService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Display a listing of settings.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        $filters = [];

        if ($request->has('group')) {
            $filters['group'] = $request->group;
        }

        if ($request->has('user_id')) {
            $filters['user_id'] = $request->user_id === 'null' ? null : (int) $request->user_id;
        }

        if ($request->has('is_public')) {
            $filters['is_public'] = filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->has('search')) {
            $filters['search'] = $request->search;
        }

        $settings = app(GetAllSettingsQuery::class, ['filters' => $filters])->execute();

        return response()->json([
            'success' => true,
            'data' => SettingData::collect($settings)->toArray(),
        ]);
    }

    /**
     * Store a newly created setting.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Setting::class);

        $setting = app(CreateSettingAction::class)->execute(
            SettingData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => SettingData::from($setting),
            'message' => 'Setting created successfully',
        ], 201);
    }

    /**
     * Display the specified setting.
     */
    public function show(Setting $setting): JsonResponse
    {
        $this->authorize('view', $setting);

        return response()->json([
            'success' => true,
            'data' => SettingData::from($setting),
        ]);
    }

    /**
     * Update the specified setting.
     */
    public function update(Request $request, Setting $setting): JsonResponse
    {
        $this->authorize('update', $setting);

        $setting = app(UpdateSettingAction::class)->execute(
            $setting,
            SettingData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => SettingData::from($setting),
            'message' => 'Setting updated successfully',
        ]);
    }

    /**
     * Remove the specified setting.
     */
    public function destroy(Setting $setting): JsonResponse
    {
        $this->authorize('delete', $setting);

        app(DeleteSettingAction::class)->execute($setting);

        return response()->json([
            'success' => true,
            'message' => 'Setting deleted successfully',
        ], 204);
    }

    /**
     * Get all available setting types with their metadata
     */
    public function types(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => SettingType::toArray(),
        ]);
    }

    /**
     * Get all settings grouped by group
     */
    public function grouped(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        $filters = [];

        if ($request->has('user_id')) {
            $filters['user_id'] = $request->user_id === 'null' ? null : (int) $request->user_id;
        }

        $settings = app(GetAllSettingsQuery::class, ['filters' => $filters])->execute();

        // Group by group
        $grouped = $settings->groupBy('group')->map(function ($items, $group) {
            return [
                'group' => $group ?? 'uncategorized',
                'settings' => SettingData::collect($items)->toArray(),
                'count' => $items->count(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $grouped,
        ]);
    }

    /**
     * Get all feature flags
     */
    public function featureFlags(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        $userId = $request->has('user_id') && $request->user_id !== 'null'
            ? (int) $request->user_id
            : null;

        $featureFlags = app(FeatureFlagService::class)->all($userId);

        return response()->json([
            'success' => true,
            'data' => SettingData::collect($featureFlags)->toArray(),
        ]);
    }

    /**
     * Get only enabled feature flags
     */
    public function enabledFeatures(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        $userId = $request->has('user_id') && $request->user_id !== 'null'
            ? (int) $request->user_id
            : null;

        $featureFlags = app(FeatureFlagService::class)->enabled($userId);

        return response()->json([
            'success' => true,
            'data' => SettingData::collect($featureFlags)->toArray(),
        ]);
    }

    /**
     * Toggle a feature flag
     */
    public function toggleFeature(Request $request, string $feature): JsonResponse
    {
        // Check if user can edit settings
        $this->authorize('create', Setting::class);

        $userId = $request->has('user_id') && $request->user_id !== 'null'
            ? (int) $request->user_id
            : null;

        $setting = app(FeatureFlagService::class)->toggle($feature, $userId);

        return response()->json([
            'success' => true,
            'data' => SettingData::from($setting),
            'message' => 'Feature flag toggled successfully',
        ]);
    }

    /**
     * Get a setting value by key (simplified endpoint for frontend)
     */
    public function getByKey(Request $request, string $key): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        $userId = $request->has('user_id') && $request->user_id !== 'null'
            ? (int) $request->user_id
            : null;

        $value = app(SettingService::class)->get($key, null, $userId);

        if ($value === null) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'key' => $key,
                'value' => $value,
            ],
        ]);
    }

    /**
     * Set a setting value by key (simplified endpoint for frontend)
     */
    public function setByKey(Request $request, string $key): JsonResponse
    {
        $this->authorize('create', Setting::class);

        $validated = $request->validate([
            'value' => 'required',
            'user_id' => 'nullable|integer|exists:users,id',
            'group' => 'nullable|string|max:100',
            'is_public' => 'nullable|boolean',
        ]);

        $userId = $validated['user_id'] ?? null;
        $group = $validated['group'] ?? null;
        $isPublic = $validated['is_public'] ?? false;

        $setting = app(SettingService::class)->set(
            $key,
            $validated['value'],
            $userId,
            $group,
            $isPublic
        );

        return response()->json([
            'success' => true,
            'data' => SettingData::from($setting),
            'message' => 'Setting updated successfully',
        ]);
    }

    /**
     * Reset a setting to its default value
     */
    public function reset(Setting $setting): JsonResponse
    {
        $this->authorize('update', $setting);

        $setting->reset();

        return response()->json([
            'success' => true,
            'data' => SettingData::from($setting->fresh()),
            'message' => 'Setting reset to default value',
        ]);
    }
}
