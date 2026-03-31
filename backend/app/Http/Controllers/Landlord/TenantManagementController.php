<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Data\Landlord\PlanData;
use App\Data\Landlord\TenantData;
use App\Data\Landlord\TenantSubscriptionData;
use App\Data\Landlord\TenantSubscriptionFeatureData;
use App\Events\TenantActivated;
use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use App\Models\Tenant;
use App\Services\FeatureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;

class TenantManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenants = Tenant::query()
            ->when($request->search, fn ($q, $search) => $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            }))
            ->when($request->status, function ($q, $status) {
                $tenantIds = TenantSubscription::where('status', $status)
                    ->pluck('tenant_id');
                $q->whereIn('id', $tenantIds);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $data = $tenants->map(function (Tenant $tenant) {
            $subscription = TenantSubscription::where('tenant_id', $tenant->id)
                ->with(['plan', 'subscriptionFeatures'])
                ->orderBy('created_at', 'desc')
                ->first();

            $subscriptionData = $subscription
                ? $this->buildSubscriptionData($subscription)
                : null;

            return new TenantData(
                id: $tenant->id,
                name: $tenant->name,
                slug: $tenant->slug,
                created_at: $tenant->created_at?->toIsoString() ?? '',
                subscription: $subscriptionData,
            );
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $tenants->currentPage(),
                'total' => $tenants->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $subscription = TenantSubscription::where('tenant_id', $id)
            ->with(['plan', 'subscriptionFeatures'])
            ->orderBy('created_at', 'desc')
            ->first();

        $subscriptionData = $subscription
            ? $this->buildSubscriptionData($subscription)
            : null;

        return response()->json([
            'success' => true,
            'data' => new TenantData(
                id: $tenant->id,
                name: $tenant->name,
                slug: $tenant->slug,
                created_at: $tenant->created_at?->toIsoString() ?? '',
                subscription: $subscriptionData,
            ),
        ]);
    }

    private function buildSubscriptionData(TenantSubscription $subscription): TenantSubscriptionData
    {
        $addons = $subscription->subscriptionFeatures->map(fn ($f) => new TenantSubscriptionFeatureData(
            id: $f->id,
            feature_key: $f->feature_key,
            price_at_purchase: $f->price_at_purchase !== null ? (float) $f->price_at_purchase : null,
        ));

        $basePrice = $subscription->plan?->price ?? 0.0;
        $addonsTotal = $addons->sum(fn ($a) => $a->price_at_purchase ?? 0.0);
        $totalPrice = $basePrice + $addonsTotal;

        return new TenantSubscriptionData(
            id: $subscription->id,
            tenant_id: $subscription->tenant_id,
            plan_id: $subscription->plan_id,
            status: $subscription->status,
            starts_at: $subscription->starts_at?->toIsoString(),
            ends_at: $subscription->ends_at?->toIsoString(),
            trial_ends_at: $subscription->trial_ends_at?->toIsoString(),
            billing_cycle: $subscription->billing_cycle,
            renews_at: $subscription->renews_at?->toIsoString(),
            notes: $subscription->notes,
            created_at: $subscription->created_at?->toIsoString() ?? '',
            plan: $subscription->plan
                ? PlanData::from($subscription->plan)
                : null,
            addons: new DataCollection(TenantSubscriptionFeatureData::class, $addons->all()),
            total_price: $totalPrice,
        );
    }

    public function activate(string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $subscription = TenantSubscription::where('tenant_id', $id)
            ->orderBy('created_at', 'desc')
            ->firstOrFail();

        $renewsAt = $subscription->billing_cycle === 'yearly'
            ? now()->addYear()
            : now()->addMonth();

        $subscription->update([
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => null,
            'renews_at' => $renewsAt,
        ]);

        // Invalida cache feature per il tenant appena attivato
        app(FeatureService::class)->clearCache($id);

        // Dispatch activation event to notify the tenant admin via email
        $adminMembership = TenantMembership::where('tenant_id', $id)
            ->where('role', 'admin')
            ->where('status', 'active')
            ->first();

        if ($adminMembership) {
            $adminUser = GlobalUser::find($adminMembership->global_user_id);
            if ($adminUser) {
                TenantActivated::dispatch($tenant, $adminUser);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Tenant attivato con successo.',
        ]);
    }

    public function suspend(string $id): JsonResponse
    {
        $subscription = TenantSubscription::where('tenant_id', $id)
            ->orderBy('created_at', 'desc')
            ->firstOrFail();

        $subscription->update(['status' => 'suspended']);

        // Invalida cache feature per il tenant appena sospeso
        app(FeatureService::class)->clearCache($id);

        return response()->json([
            'success' => true,
            'message' => 'Tenant sospeso.',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        TenantSubscription::where('tenant_id', $id)->delete();

        $tenant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tenant eliminato.',
        ]);
    }
}
