<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Subscription\RequestAddonAction;
use App\Actions\Subscription\RequestPlanChangeAction;
use App\Actions\Subscription\RequestRenewalAction;
use App\Data\Landlord\RenewalRequestData;
use App\Http\Controllers\Controller;
use App\Models\Landlord\LandlordSetting;
use App\Models\Landlord\Plan;
use App\Models\Landlord\PlanFeature;
use App\Models\Landlord\RenewalRequest;
use App\Models\Landlord\TenantSubscription;
use App\Models\Landlord\TenantSubscriptionFeature;
use App\Services\ProrationCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TenantSubscriptionController extends Controller
{
    private static array $featureNames = [
        'customers' => 'Clienti',
        'suppliers' => 'Fornitori',
        'quotes' => 'Preventivi',
        'projects' => 'Cantieri',
        'warehouse' => 'Magazzino',
        'workers' => 'Personale',
        'rental' => 'Noleggio',
        'invoicing' => 'Fatturazione',
        'reports' => 'Report',
        'time_tracking' => 'Rilevazione presenze',
    ];

    private function featureName(string $featureKey): string
    {
        return self::$featureNames[$featureKey]
            ?? str($featureKey)->replace('_', ' ')->title()->toString();
    }

    public function show(Request $request): JsonResponse
    {
        $membership = $request->attributes->get('tenant_membership');

        if ($membership && $membership->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accesso riservato agli amministratori del tenant.',
            ], 403);
        }

        $tenantId = tenancy()->tenant->id;

        $subscription = TenantSubscription::where('tenant_id', $tenantId)
            ->with(['plan', 'subscriptionFeatures'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Nessun abbonamento trovato.',
            ], 404);
        }

        // Determine the relevant expiry date and days remaining
        $expiryDate = null;
        if ($subscription->status === 'trial') {
            $expiryDate = $subscription->trial_ends_at;
        } elseif ($subscription->renews_at) {
            $expiryDate = $subscription->renews_at;
        } elseif ($subscription->ends_at) {
            $expiryDate = $subscription->ends_at;
        }

        $daysRemaining = $expiryDate
            ? (int) now()->diffInDays($expiryDate, false)
            : null;

        // Read banner threshold from landlord settings
        $bannerDaysBefore = (int) LandlordSetting::get('subscription.banner_days_before', 14);

        $showRenewalWarning = $daysRemaining !== null && $daysRemaining <= $bannerDaysBefore;

        // Also show warning for expired/suspended
        if (in_array($subscription->status, ['expired', 'suspended'], true)) {
            $showRenewalWarning = true;
        }

        // Build addons list:
        // 1. Plan features with price=null/0 are "included" in the plan
        // 2. tenant_subscription_features are separately purchased add-ons (price > 0)
        $allPlanFeatures = $subscription->plan_id
            ? PlanFeature::where('plan_id', $subscription->plan_id)->get()->keyBy('feature_key')
            : collect();

        $purchasedKeys = $subscription->subscriptionFeatures->pluck('feature_key')->toArray();

        // Included features (plan base features, price = null or 0)
        $includedAddons = $allPlanFeatures
            ->filter(fn ($f) => is_null($f->price) || (float) $f->price == 0)
            ->map(fn ($f) => [
                'id' => $f->id,
                'feature_key' => $f->feature_key,
                'name' => $this->featureName($f->feature_key),
                'price_monthly' => null,
                'price_yearly' => null,
                'is_active' => true,
                'is_included' => true,
            ])->values();

        // Purchased add-ons (tracked in tenant_subscription_features)
        $purchasedAddons = $subscription->subscriptionFeatures->map(function ($feature) use ($allPlanFeatures) {
            $pf = $allPlanFeatures->get($feature->feature_key);

            return [
                'id' => $feature->id,
                'feature_key' => $feature->feature_key,
                'name' => $this->featureName($feature->feature_key),
                'price_monthly' => $pf && $pf->price !== null ? (float) $pf->price : null,
                'price_yearly' => $pf && $pf->price_yearly !== null ? (float) $pf->price_yearly : null,
                'is_active' => true,
                'is_included' => false,
            ];
        })->values();

        $addons = $includedAddons->merge($purchasedAddons)->values()->toArray();

        // Check for a pending renewal request
        $pendingRenewalRequest = RenewalRequest::where('tenant_subscription_id', $subscription->id)
            ->where('status', 'pending')
            ->whereIn('type', ['renewal', 'renewal_with_addons'])
            ->first();

        // Check for a pending plan change request
        $pendingPlanChangeRequest = RenewalRequest::where('tenant_subscription_id', $subscription->id)
            ->where('status', 'pending')
            ->whereIn('type', ['upgrade', 'downgrade'])
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $subscription->status,
                'plan_id' => $subscription->plan_id,
                'plan_name' => $subscription->plan?->name,
                'billing_cycle' => $subscription->billing_cycle,
                'renews_at' => $subscription->renews_at,
                'trial_ends_at' => $subscription->trial_ends_at,
                'ends_at' => $subscription->ends_at,
                'days_remaining' => $daysRemaining,
                'show_renewal_warning' => $showRenewalWarning,
                'addons' => $addons,
                'pending_renewal' => $pendingRenewalRequest ? [
                    'id' => $pendingRenewalRequest->id,
                    'type' => $pendingRenewalRequest->type,
                    'status' => $pendingRenewalRequest->status,
                    'created_at' => $pendingRenewalRequest->created_at,
                    'notes' => $pendingRenewalRequest->notes,
                    'amount' => $pendingRenewalRequest->prorated_amount,
                ] : null,
                'pending_plan_change' => $pendingPlanChangeRequest ? [
                    'id' => $pendingPlanChangeRequest->id,
                    'type' => $pendingPlanChangeRequest->type,
                    'status' => $pendingPlanChangeRequest->status,
                    'created_at' => $pendingPlanChangeRequest->created_at,
                    'notes' => $pendingPlanChangeRequest->notes,
                    'target_plan_id' => $pendingPlanChangeRequest->target_plan_id,
                ] : null,
            ],
        ]);
    }

    public function requestRenewal(Request $request): JsonResponse
    {
        $membership = $request->attributes->get('tenant_membership');

        if ($membership->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accesso riservato agli amministratori del tenant.',
            ], 403);
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
            'addons' => ['nullable', 'array'],
            'addons.*' => ['string'],
        ]);

        $tenantId = tenancy()->tenant->id;

        $subscription = TenantSubscription::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Nessun abbonamento trovato.',
            ], 404);
        }

        // Only allow renewal from: active, trial, or recently expired subscriptions
        $renewableStatuses = ['active', 'trial', 'expired', 'pending_payment'];
        if (! in_array($subscription->status, $renewableStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => ['Impossibile richiedere il rinnovo per un abbonamento in stato: '.$subscription->status],
            ]);
        }

        $globalUser = $request->user('global');

        $renewalRequest = app(RequestRenewalAction::class)->execute(
            subscription: $subscription,
            requestedBy: $globalUser,
            notes: $validated['notes'] ?? null,
            addonFeatureKeys: $validated['addons'] ?? null,
        );

        return response()->json([
            'success' => true,
            'data' => RenewalRequestData::from($renewalRequest),
            'message' => 'Richiesta di rinnovo inviata con successo.',
        ], 201);
    }

    public function requestAddon(Request $request): JsonResponse
    {
        $membership = $request->attributes->get('tenant_membership');

        if ($membership->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accesso riservato agli amministratori del tenant.',
            ], 403);
        }

        $validated = $request->validate([
            'addons' => ['required', 'array', 'min:1'],
            'addons.*' => ['string'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $tenantId = tenancy()->tenant->id;

        $subscription = TenantSubscription::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $subscription || $subscription->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'È necessario un abbonamento attivo per aggiungere addon.',
            ], 422);
        }

        $globalUser = $request->user('global');

        // RequestAddonAction handles proration calculation
        $renewalRequest = app(RequestAddonAction::class)->execute(
            subscription: $subscription,
            requestedBy: $globalUser,
            addonFeatureKeys: $validated['addons'],
            notes: $validated['notes'] ?? null,
        );

        // Build proration breakdown preview for the response
        $prorationService = app(ProrationCalculatorService::class);
        $billingCycle = $subscription->billing_cycle;

        $addonsWithPrices = PlanFeature::where('plan_id', $subscription->plan_id)
            ->whereIn('feature_key', $validated['addons'])
            ->get()
            ->map(fn ($f) => [
                'feature_key' => $f->feature_key,
                'price' => $billingCycle === 'yearly' ? (float) $f->price_yearly : (float) $f->price,
            ])
            ->toArray();

        $prorationBreakdown = $subscription->renews_at
            ? $prorationService->calculateMultipleAddonsProration($addonsWithPrices, $billingCycle, $subscription->renews_at)
            : null;

        return response()->json([
            'success' => true,
            'data' => RenewalRequestData::from($renewalRequest),
            'proration_breakdown' => $prorationBreakdown,
            'message' => 'Richiesta addon inviata con successo.',
        ], 201);
    }

    public function getRequests(Request $request): JsonResponse
    {
        $membership = $request->attributes->get('tenant_membership');

        if ($membership->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accesso riservato agli amministratori del tenant.',
            ], 403);
        }

        $tenantId = tenancy()->tenant->id;

        $requests = RenewalRequest::where('tenant_id', $tenantId)
            ->with(['tenantSubscription'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => RenewalRequestData::collect($requests),
        ]);
    }

    public function changePlan(Request $request): JsonResponse
    {
        $membership = $request->attributes->get('tenant_membership');

        if ($membership->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accesso riservato agli amministratori del tenant.',
            ], 403);
        }

        $validated = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:landlord.plans,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $tenantId = tenancy()->tenant->id;

        $subscription = TenantSubscription::where('tenant_id', $tenantId)
            ->with('plan')
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Nessun abbonamento trovato.',
            ], 404);
        }

        if (! in_array($subscription->status, ['active', 'trial'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Il cambio piano è disponibile solo per abbonamenti attivi o in prova.',
            ], 422);
        }

        if ((int) $validated['plan_id'] === (int) $subscription->plan_id) {
            return response()->json([
                'success' => false,
                'message' => 'Il piano selezionato è già quello attivo.',
            ], 422);
        }

        $targetPlan = Plan::findOrFail($validated['plan_id']);
        $globalUser = $request->user('global');

        $renewalRequest = app(RequestPlanChangeAction::class)->execute(
            subscription: $subscription,
            requestedBy: $globalUser,
            targetPlan: $targetPlan,
            notes: $validated['notes'] ?? null,
        );

        return response()->json([
            'success' => true,
            'data' => RenewalRequestData::from($renewalRequest),
            'message' => 'Richiesta di cambio piano inviata con successo.',
        ], 201);
    }

    public function getAvailableAddons(Request $request): JsonResponse
    {
        $membership = $request->attributes->get('tenant_membership');

        if ($membership->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accesso riservato agli amministratori del tenant.',
            ], 403);
        }

        $tenantId = tenancy()->tenant->id;

        $subscription = TenantSubscription::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $subscription || ! $subscription->plan_id) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        // Fetch active addon keys for this subscription
        $activeAddonKeys = TenantSubscriptionFeature::where('tenant_subscription_id', $subscription->id)
            ->pluck('feature_key')
            ->toArray();

        // Only purchasable add-ons (plan features with a non-null, non-zero price)
        // that haven't already been purchased
        $availableFeatures = PlanFeature::where('plan_id', $subscription->plan_id)
            ->whereNotNull('price')
            ->where('price', '>', 0)
            ->whereNotIn('feature_key', $activeAddonKeys)
            ->get();

        $billingCycle = $subscription->billing_cycle;
        $prorationService = app(ProrationCalculatorService::class);

        $data = $availableFeatures->values()->map(function ($feature) use ($billingCycle, $prorationService, $subscription) {
            $price = $billingCycle === 'yearly' ? (float) $feature->price_yearly : (float) $feature->price;

            $proratedAmount = null;
            $proratedDaysRemaining = null;
            if ($price > 0 && $subscription->renews_at) {
                $proratedResult = $prorationService->calculateAddonProration($price, $billingCycle, $subscription->renews_at);
                $proratedAmount = $proratedResult['prorated_amount'];
                $proratedDaysRemaining = $proratedResult['cycle_days_remaining'] ?? null;
            }

            return [
                'id' => $feature->id,
                'feature_key' => $feature->feature_key,
                'name' => $this->featureName($feature->feature_key),
                'description' => null,
                'price_monthly' => $feature->price !== null ? (float) $feature->price : null,
                'price_yearly' => $feature->price_yearly !== null ? (float) $feature->price_yearly : null,
                'prorated_amount' => $proratedAmount,
                'prorated_days_remaining' => $proratedDaysRemaining,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
