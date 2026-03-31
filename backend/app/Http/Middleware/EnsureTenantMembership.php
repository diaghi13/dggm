<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Landlord\TenantMembership;
use App\Models\Landlord\TenantSubscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantMembership
{
    public function handle(Request $request, Closure $next): Response
    {
        // This middleware is a no-op when no tenant is initialized
        if (! tenancy()->initialized) {
            return $next($request);
        }

        $tenantId = tenancy()->tenant->id;
        $user = $request->user('global');

        if (! $user) {
            // Retrocompatibility: if there is a sanctum user, let it pass
            if ($request->user()) {
                return $next($request);
            }

            return response()->json([
                'success' => false,
                'message' => 'Non autenticato.',
            ], 401);
        }

        // Verify membership
        $membership = TenantMembership::where('global_user_id', $user->id)
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json([
                'success' => false,
                'message' => 'Accesso non autorizzato a questo tenant.',
            ], 403);
        }

        // Verify active subscription
        $subscription = TenantSubscription::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $subscription || (! $subscription->isActive() && ! $subscription->isInTrial())) {
            return response()->json([
                'success' => false,
                'message' => 'Abbonamento non attivo. Contatta il supporto per attivare il servizio.',
                'subscription_status' => $subscription?->status ?? 'none',
            ], 402);
        }

        // Store membership info on the request for downstream use
        $request->attributes->set('tenant_membership', $membership);
        $request->attributes->set('tenant_role', $membership->role);

        return $next($request);
    }
}
