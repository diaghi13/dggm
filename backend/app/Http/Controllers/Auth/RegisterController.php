<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Enums\BootstrapStatus;
use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\Plan;
use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use App\Models\Landlord\TenantSubscriptionFeature;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique(GlobalUser::class, 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'company_name' => ['required', 'string', 'max:255'],
            'plan_id' => ['required', Rule::exists(Plan::class, 'id')],
            'billing_cycle' => ['sometimes', 'string', Rule::in(['monthly', 'yearly'])],
            'addons' => ['sometimes', 'array'],
            'addons.*' => ['string'],
        ]);

        $globalUser = GlobalUser::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        $slug = Str::slug($request->company_name).'-'.Str::random(6);
        $tenant = Tenant::create([
            'name' => $request->company_name,
            'slug' => $slug,
            'global_user_id' => $globalUser->id,
            'company_name' => $request->company_name,
            'bootstrap_status' => BootstrapStatus::Pending->value,
        ]);

        TenantMembership::create([
            'global_user_id' => $globalUser->id,
            'tenant_id' => $tenant->id,
            'role' => 'admin',
            'status' => 'active',
        ]);

        $plan = Plan::with('features')->find($request->plan_id);
        $billingCycle = $request->billing_cycle ?? 'monthly';
        $trialEndsAt = $plan && $plan->trial_days > 0
            ? now()->addDays($plan->trial_days)
            : null;
        $initialStatus = $trialEndsAt ? 'trial' : 'pending_payment';

        $subscription = TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $request->plan_id,
            'status' => $initialStatus,
            'billing_cycle' => $billingCycle,
            'trial_ends_at' => $trialEndsAt,
        ]);

        // Create addon records for any optional features the customer selected
        $addonKeys = $request->input('addons', []);
        foreach ($addonKeys as $featureKey) {
            $planFeature = $plan?->features->firstWhere('feature_key', $featureKey);
            if ($planFeature && $planFeature->price > 0) {
                $addonPrice = $billingCycle === 'yearly' && $planFeature->price_yearly !== null
                    ? $planFeature->price_yearly
                    : $planFeature->price;

                TenantSubscriptionFeature::create([
                    'tenant_subscription_id' => $subscription->id,
                    'feature_key' => $featureKey,
                    'price_at_purchase' => $addonPrice,
                ]);
            }
        }

        $token = $globalUser->createToken('global-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrazione completata. Il tuo account è in fase di configurazione.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $globalUser->id,
                    'name' => $globalUser->name,
                    'email' => $globalUser->email,
                ],
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                ],
                'subscription_status' => $initialStatus,
            ],
        ], 201);
    }

    public function tenantStatus(string $tenantId): JsonResponse
    {
        $tenant = Tenant::findOrFail($tenantId);

        $subscription = TenantSubscription::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'tenant_id' => $tenantId,
                'subscription_status' => $subscription?->status ?? 'none',
                'tenant_name' => $tenant->name,
            ],
        ]);
    }
}
