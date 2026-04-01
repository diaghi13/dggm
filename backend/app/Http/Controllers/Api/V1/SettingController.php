<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Setting\CreateSettingAction;
use App\Actions\Setting\DeleteSettingAction;
use App\Actions\Setting\UpdateSettingAction;
use App\Data\SettingData;
use App\Enums\SettingType;
use App\Http\Controllers\Controller;
use App\Jobs\RecalculateRentalPricesJob;
use App\Models\Setting;
use App\Queries\Setting\GetAllSettingsQuery;
use App\Services\FeatureFlagService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        if (str_starts_with($setting->key, 'rental.')) {
            RecalculateRentalPricesJob::dispatch();
        }

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
            'value' => ['nullable', 'string'],
            'user_id' => 'nullable|integer|exists:users,id',
            'group' => 'nullable|string|max:100',
            'is_public' => 'nullable|boolean',
        ]);

        $userId = $validated['user_id'] ?? null;
        $group = $validated['group'] ?? null;
        $isPublic = $validated['is_public'] ?? false;

        $setting = app(SettingService::class)->set(
            $key,
            $validated['value'] ?? '',
            $userId,
            $group,
            $isPublic
        );

        if (str_starts_with($key, 'rental.')) {
            RecalculateRentalPricesJob::dispatch();
        }

        return response()->json([
            'success' => true,
            'data' => SettingData::from($setting),
            'message' => 'Setting updated successfully',
        ]);
    }

    /**
     * Batch update multiple settings in a single transaction
     */
    public function batchUpdate(Request $request): JsonResponse
    {
        $this->authorize('create', Setting::class);

        $validated = $request->validate([
            'settings' => ['required', 'array', 'min:1'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable', 'string'],
            'settings.*.group' => ['nullable', 'string', 'max:100'],
            'settings.*.is_public' => ['nullable', 'boolean'],
            'settings.*.user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $service = app(SettingService::class);
        $shouldRecalculateRental = false;

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $service, &$shouldRecalculateRental) {
            foreach ($validated['settings'] as $item) {
                $service->set(
                    $item['key'],
                    $item['value'] ?? '',
                    $item['user_id'] ?? null,
                    $item['group'] ?? null,
                    $item['is_public'] ?? false,
                );

                if (str_starts_with($item['key'], 'rental.')) {
                    $shouldRecalculateRental = true;
                }
            }
        });

        if ($shouldRecalculateRental) {
            RecalculateRentalPricesJob::dispatch();
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
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

    /**
     * Upload company logo
     */
    public function uploadCompanyLogo(Request $request): JsonResponse
    {
        abort_unless(auth()->user()->hasRole(['super-admin', 'admin']), 403);

        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,jpg,svg,webp', 'max:2048'],
        ]);

        $file = $request->file('logo');
        $filename = 'logo.'.$file->getClientOriginalExtension();
        $file->storeAs('company', $filename, 'public');
        $relativePath = parse_url(Storage::disk('public')->url("company/{$filename}"), PHP_URL_PATH);

        \App\Models\Setting::set('company.logo', $relativePath, null, 'company', true);

        return response()->json([
            'success' => true,
            'data' => ['url' => $relativePath],
        ]);
    }

    /**
     * Delete company logo
     */
    public function deleteCompanyLogo(): JsonResponse
    {
        abort_unless(auth()->user()->hasRole(['super-admin', 'admin']), 403);

        $current = \App\Models\Setting::get('company.logo');
        if ($current) {
            Storage::disk('public')->delete('company/'.basename($current));
            \App\Models\Setting::set('company.logo', null);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Upload company image (stamp or signature)
     */
    public function uploadCompanyImage(Request $request, string $type): JsonResponse
    {
        abort_unless(in_array($type, ['stamp', 'sigla']), 404);
        abort_unless(auth()->user()->hasRole(['super-admin', 'admin']), 403);

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
        ]);

        $file = $request->file('image');
        $filename = "{$type}.png";
        $file->storeAs('company', $filename, 'public');
        $relativePath = parse_url(Storage::disk('public')->url("company/{$filename}"), PHP_URL_PATH);

        \App\Models\Setting::set("company.{$type}", $relativePath, null, 'company', true);

        return response()->json(['success' => true, 'data' => ['url' => $relativePath]]);
    }

    /**
     * Delete company image (stamp or signature)
     */
    public function deleteCompanyImage(string $type): JsonResponse
    {
        abort_unless(in_array($type, ['stamp', 'sigla']), 404);
        abort_unless(auth()->user()->hasRole(['super-admin', 'admin']), 403);

        $current = \App\Models\Setting::get("company.{$type}");
        if ($current) {
            Storage::disk('public')->delete('company/'.basename($current));
            \App\Models\Setting::set("company.{$type}", null);
        }

        return response()->json(['success' => true]);
    }
}
