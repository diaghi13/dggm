<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Landlord\AcceptTenantInvitationAction;
use App\Actions\Landlord\InviteTenantMemberAction;
use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantInvitationController extends Controller
{
    /**
     * POST /api/v1/tenant-invitations
     * Authenticated tenant admin invites someone to this tenant.
     */
    public function invite(Request $request): JsonResponse
    {
        $this->authorize('create', \App\Models\User::class);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', 'string', 'in:admin,project-manager,worker,warehouse-manager,accountant,foreman'],
        ]);

        $tenantId = tenancy()->tenant?->id;

        $membership = app(InviteTenantMemberAction::class)->execute(
            $tenantId,
            $validated['email'],
            $validated['role']
        );

        return response()->json([
            'success' => true,
            'message' => 'Invito inviato con successo.',
            'data' => [
                'id' => $membership->id,
                'email' => $validated['email'],
                'role' => $membership->role,
                'expires_at' => $membership->expires_at?->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * POST /api/v1/tenant-invitations/accept
     * Public — anyone with the token can accept.
     */
    public function accept(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'password' => ['nullable', 'string', 'min:8'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $result = app(AcceptTenantInvitationAction::class)->execute(
            $validated['token'],
            $validated['password'] ?? null,
            $validated['name'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Invito accettato. Puoi ora effettuare il login.',
            'data' => [
                'global_user_id' => $result['globalUser']->id,
                'email' => $result['globalUser']->email,
            ],
        ]);
    }

    /**
     * GET /api/v1/tenant-invitations/preview/{token}
     * Public — preview invitation details before accepting.
     */
    public function preview(string $token): JsonResponse
    {
        $membership = TenantMembership::where('invitation_token', $token)
            ->where('status', 'invited')
            ->firstOrFail();

        if ($membership->expires_at?->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Invito scaduto.',
            ], 410);
        }

        $tenant = Tenant::find($membership->tenant_id);
        $globalUser = GlobalUser::find($membership->global_user_id);

        return response()->json([
            'success' => true,
            'data' => [
                'tenant_name' => $tenant?->name,
                'email' => $globalUser?->email,
                'role' => $membership->role,
                'expires_at' => $membership->expires_at?->toIso8601String(),
                'is_new_user' => is_null($globalUser?->email_verified_at),
            ],
        ]);
    }
}
