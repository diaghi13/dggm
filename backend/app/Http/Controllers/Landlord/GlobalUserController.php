<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Actions\Landlord\AddTenantMembershipAction;
use App\Actions\Landlord\RemoveTenantMembershipAction;
use App\Actions\Landlord\ToggleLandlordAdminAction;
use App\Data\Landlord\GlobalUserData;
use App\Data\Landlord\TenantMembershipWithTenantData;
use App\Events\GlobalUserUpdated;
use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\Optional;

class GlobalUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = GlobalUser::query()
            ->withCount('tenantMemberships')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate((int) $request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => GlobalUserData::collect($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = GlobalUser::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => GlobalUserData::fromModel($user),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = GlobalUser::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'is_landlord_admin' => ['nullable', 'boolean'],
        ]);

        $changedFields = array_keys(array_filter(
            $validated,
            fn ($value, $key) => $user->getAttribute($key) !== $value,
            ARRAY_FILTER_USE_BOTH
        ));

        $user->update($validated);

        if (! empty($changedFields)) {
            GlobalUserUpdated::dispatch($user->fresh(), $changedFields);
        }

        return response()->json([
            'success' => true,
            'data' => GlobalUserData::fromModel($user->fresh()),
        ]);
    }

    public function toggleAdmin(string $id): JsonResponse
    {
        $user = GlobalUser::findOrFail($id);

        $user = app(ToggleLandlordAdminAction::class)->execute($user);

        return response()->json([
            'success' => true,
            'data' => GlobalUserData::fromModel($user),
        ]);
    }

    public function memberships(string $id): JsonResponse
    {
        $user = GlobalUser::findOrFail($id);

        $memberships = $user->tenantMemberships()->get();

        $data = $memberships->map(function (TenantMembership $membership) {
            $tenant = Tenant::find($membership->tenant_id);

            return new TenantMembershipWithTenantData(
                id: $membership->id,
                tenant_id: $membership->tenant_id,
                tenant_name: $tenant?->name ?? $membership->tenant_id,
                role: $membership->role,
                status: $membership->status,
                created_at: $membership->created_at?->toIsoString() ?? Optional::create(),
            );
        });

        return response()->json([
            'success' => true,
            'data' => $data->values(),
        ]);
    }

    public function addMembership(Request $request, string $id): JsonResponse
    {
        $user = GlobalUser::findOrFail($id);

        $validated = $request->validate([
            'tenant_id' => ['required', 'string'],
            'role' => ['nullable', 'string'],
        ]);

        $role = $validated['role'] ?? 'admin';

        $membership = app(AddTenantMembershipAction::class)->execute($user, $validated['tenant_id'], $role);

        $tenant = Tenant::find($membership->tenant_id);

        $data = new TenantMembershipWithTenantData(
            id: $membership->id,
            tenant_id: $membership->tenant_id,
            tenant_name: $tenant?->name ?? $membership->tenant_id,
            role: $membership->role,
            status: $membership->status,
            created_at: $membership->created_at?->toIsoString() ?? Optional::create(),
        );

        return response()->json([
            'success' => true,
            'data' => $data,
        ], 201);
    }

    public function removeMembership(string $userId, int $membershipId): JsonResponse
    {
        $user = GlobalUser::findOrFail($userId);

        $membership = TenantMembership::where('id', $membershipId)
            ->where('global_user_id', $user->id)
            ->firstOrFail();

        app(RemoveTenantMembershipAction::class)->execute($membership);

        return response()->noContent();
    }
}
