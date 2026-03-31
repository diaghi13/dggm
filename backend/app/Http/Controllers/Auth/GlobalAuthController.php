<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Data\Landlord\GlobalUserData;
use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class GlobalAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = GlobalUser::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Le credenziali fornite non sono corrette.'],
            ]);
        }

        $token = $user->createToken('global-token')->plainTextToken;

        $tenants = $this->getUserTenants($user);

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => GlobalUserData::fromModel($user),
                'tenants' => $tenants,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var GlobalUser $user */
        $user = $request->user('global');

        $tenants = $this->getUserTenants($user);

        // Load tenant-specific roles if we're in a tenant context
        $roles = [];
        $permissions = [];
        if (tenancy()->initialized) {
            $tenantUser = \App\Models\User::where('global_user_id', $user->id)->first();
            if ($tenantUser) {
                $roles = $tenantUser->getRoleNames()->toArray();
                $permissions = $tenantUser->getAllPermissions()->pluck('name')->toArray();
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => GlobalUserData::fromModel($user),
                'tenants' => $tenants,
                'roles' => $roles,
                'permissions' => $permissions,
            ],
        ]);
    }

    public function tenants(Request $request): JsonResponse
    {
        /** @var GlobalUser $user */
        $user = $request->user('global');

        $tenants = $this->getUserTenants($user);

        return response()->json([
            'success' => true,
            'data' => $tenants,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user('global')?->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Disconnesso con successo.',
        ]);
    }

    /**
     * Returns an array of tenant summaries for a given GlobalUser.
     *
     * @return array<int, array{id: string, name: string, slug: string, role: string}>
     */
    private function getUserTenants(GlobalUser $user): array
    {
        $memberships = TenantMembership::where('global_user_id', $user->id)
            ->where('status', 'active')
            ->get();

        return $memberships->map(function (TenantMembership $membership): ?array {
            $tenant = Tenant::find($membership->tenant_id);
            if (! $tenant) {
                return null;
            }

            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'role' => $membership->role,
            ];
        })->filter()->values()->all();
    }
}
