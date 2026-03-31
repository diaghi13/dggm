<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Data\Landlord\PlanData;
use App\Http\Controllers\Controller;
use App\Models\Landlord\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlansController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->with('features')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => PlanData::collect($plans),
        ]);
    }

    public function adminIndex(): JsonResponse
    {
        $plans = Plan::query()
            ->withCount('subscriptions')
            ->with('features')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $plans->map(fn ($plan) => [
                ...PlanData::from($plan)->toArray(),
                'tenant_count' => $plan->subscriptions_count,
            ]),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $plan = Plan::with('features')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => PlanData::from($plan),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:landlord.plans,slug',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'price_yearly' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
            'trial_days' => 'integer|min:0',
            'features' => 'array',
            'features.*.feature_key' => 'required|string',
            'features.*.price' => 'nullable|numeric|min:0',
            'features.*.price_yearly' => 'nullable|numeric|min:0',
        ]);

        $plan = Plan::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'] ?? null,
            'price_yearly' => $validated['price_yearly'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
            'trial_days' => $validated['trial_days'] ?? 0,
        ]);

        foreach ($validated['features'] ?? [] as $feature) {
            $plan->features()->create([
                'feature_key' => $feature['feature_key'],
                'price' => $feature['price'] ?? null,
                'price_yearly' => $feature['price_yearly'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => PlanData::from($plan->load('features')),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => "required|string|max:100|unique:landlord.plans,slug,{$id}",
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'price_yearly' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
            'trial_days' => 'integer|min:0',
            'features' => 'array',
            'features.*.feature_key' => 'required|string',
            'features.*.price' => 'nullable|numeric|min:0',
            'features.*.price_yearly' => 'nullable|numeric|min:0',
        ]);

        $plan->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'] ?? null,
            'price_yearly' => $validated['price_yearly'] ?? null,
            'is_active' => $validated['is_active'] ?? $plan->is_active,
            'sort_order' => $validated['sort_order'] ?? $plan->sort_order,
            'trial_days' => $validated['trial_days'] ?? $plan->trial_days,
        ]);

        if (array_key_exists('features', $validated)) {
            $plan->features()->delete();
            foreach ($validated['features'] as $feature) {
                $plan->features()->create([
                    'feature_key' => $feature['feature_key'],
                    'price' => $feature['price'] ?? null,
                    'price_yearly' => $feature['price_yearly'] ?? null,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => PlanData::from($plan->load('features')),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);

        if ($plan->subscriptions()->where('status', 'active')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a plan with active subscriptions.',
            ], 422);
        }

        $plan->features()->delete();
        $plan->delete();

        return response()->json(['success' => true], 200);
    }

    public function tenantCount(int $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => ['count' => $plan->subscriptions()->count()],
        ]);
    }
}
