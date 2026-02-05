<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Role\AssignPermissionToRoleAction;
use App\Actions\Role\CreateRoleAction;
use App\Actions\Role\DeleteRoleAction;
use App\Actions\Role\RevokePermissionFromRoleAction;
use App\Actions\Role\SyncPermissionsToRoleAction;
use App\Actions\Role\UpdateRoleAction;
use App\Data\RoleData;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Role Controller
 *
 * Handles HTTP layer for role management.
 * Delegates business logic to Action classes.
 */
class RoleController extends Controller
{
    public function __construct(
        private readonly CreateRoleAction $createAction,
        private readonly UpdateRoleAction $updateAction,
        private readonly DeleteRoleAction $deleteAction,
        private readonly AssignPermissionToRoleAction $assignPermissionAction,
        private readonly RevokePermissionFromRoleAction $revokePermissionAction,
        private readonly SyncPermissionsToRoleAction $syncPermissionsAction,
    ) {}

    /**
     * Display a listing of roles.
     *
     * GET /api/v1/roles
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::with('permissions')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => RoleData::collect($roles->map(function ($role) {
                return array_merge(
                    $role->toArray(),
                    [
                        'permissions' => $role->permissions->pluck('name')->toArray(),
                        'permissions_count' => $role->permissions->count(),
                        'users_count' => $role->users()->count(),
                    ]
                );
            })),
        ]);
    }

    /**
     * Store a newly created role.
     *
     * POST /api/v1/roles
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Role::class);

        // Validate and create DTO
        $roleData = RoleData::from($request->all());

        // Execute action
        $role = $this->createAction->execute($roleData);

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully',
            'data' => RoleData::from(array_merge(
                $role->toArray(),
                ['permissions' => $role->permissions->pluck('name')->toArray()]
            )),
        ], 201);
    }

    /**
     * Display the specified role.
     *
     * GET /api/v1/roles/{id}
     */
    public function show(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        $role->load('permissions');

        return response()->json([
            'success' => true,
            'data' => RoleData::from(array_merge(
                $role->toArray(),
                [
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                    'permissions_count' => $role->permissions->count(),
                    'users_count' => $role->users()->count(),
                ]
            )),
        ]);
    }

    /**
     * Update the specified role.
     *
     * PUT/PATCH /api/v1/roles/{id}
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $this->authorize('update', $role);

        // Validate and create DTO
        $roleData = RoleData::from($request->all());

        // Execute action
        $role = $this->updateAction->execute($role, $roleData);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => RoleData::from(array_merge(
                $role->toArray(),
                ['permissions' => $role->permissions->pluck('name')->toArray()]
            )),
        ]);
    }

    /**
     * Remove the specified role.
     *
     * DELETE /api/v1/roles/{id}
     */
    public function destroy(Role $role): JsonResponse
    {
        $this->authorize('delete', $role);

        try {
            $this->deleteAction->execute($role);

            return response()->json([
                'success' => true,
                'message' => 'Role deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Assign a permission to a role.
     *
     * POST /api/v1/roles/{role}/permissions/{permission}
     */
    public function assignPermission(Role $role, Permission $permission): JsonResponse
    {
        $this->authorize('assignPermission', $role);

        $role = $this->assignPermissionAction->execute($role, $permission);

        return response()->json([
            'success' => true,
            'message' => 'Permission assigned to role successfully',
            'data' => RoleData::from(array_merge(
                $role->toArray(),
                ['permissions' => $role->permissions->pluck('name')->toArray()]
            )),
        ]);
    }

    /**
     * Revoke a permission from a role.
     *
     * DELETE /api/v1/roles/{role}/permissions/{permission}
     */
    public function revokePermission(Role $role, Permission $permission): JsonResponse
    {
        $this->authorize('revokePermission', $role);

        $role = $this->revokePermissionAction->execute($role, $permission);

        return response()->json([
            'success' => true,
            'message' => 'Permission revoked from role successfully',
            'data' => RoleData::from(array_merge(
                $role->toArray(),
                ['permissions' => $role->permissions->pluck('name')->toArray()]
            )),
        ]);
    }

    /**
     * Sync permissions for a role (bulk operation).
     *
     * POST /api/v1/roles/{role}/sync-permissions
     */
    public function syncPermissions(Request $request, Role $role): JsonResponse
    {
        $this->authorize('syncPermissions', $role);

        // Validate permissions array
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = $this->syncPermissionsAction->execute($role, $validated['permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Permissions synced successfully',
            'data' => RoleData::from(array_merge(
                $role->toArray(),
                ['permissions' => $role->permissions->pluck('name')->toArray()]
            )),
        ]);
    }
}
