<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\PermissionData;
use App\Http\Controllers\Controller;
use App\Services\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

/**
 * Permission Controller
 *
 * Handles HTTP layer for permission management.
 * Delegates business logic to PermissionService.
 */
class PermissionController extends Controller
{
    public function __construct(
        private readonly PermissionService $permissionService
    ) {}

    /**
     * Display a listing of all permissions.
     *
     * GET /api/v1/permissions
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Permission::class);

        $permissions = $this->permissionService->getAll();

        return response()->json([
            'success' => true,
            'data' => PermissionData::collect($permissions),
        ]);
    }

    /**
     * Store a newly created permission.
     *
     * POST /api/v1/permissions
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Permission::class);

        // Validate and create DTO
        $permissionData = PermissionData::from($request->all());

        // Execute service
        $permission = $this->permissionService->create($permissionData);

        return response()->json([
            'success' => true,
            'message' => 'Permission created successfully',
            'data' => PermissionData::from($permission),
        ], 201);
    }

    /**
     * Display the specified permission.
     *
     * GET /api/v1/permissions/{id}
     */
    public function show(Permission $permission): JsonResponse
    {
        $this->authorize('view', $permission);

        return response()->json([
            'success' => true,
            'data' => PermissionData::from($permission),
        ]);
    }

    /**
     * Update the specified permission.
     *
     * PUT/PATCH /api/v1/permissions/{id}
     */
    public function update(Request $request, Permission $permission): JsonResponse
    {
        $this->authorize('update', $permission);

        // Validate and create DTO
        $permissionData = PermissionData::from($request->all());

        // Execute service
        $permission = $this->permissionService->update($permission, $permissionData);

        return response()->json([
            'success' => true,
            'message' => 'Permission updated successfully',
            'data' => PermissionData::from($permission),
        ]);
    }

    /**
     * Remove the specified permission.
     *
     * DELETE /api/v1/permissions/{id}
     */
    public function destroy(Permission $permission): JsonResponse
    {
        $this->authorize('delete', $permission);

        try {
            $this->permissionService->delete($permission);

            return response()->json([
                'success' => true,
                'message' => 'Permission deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display permissions grouped by module.
     *
     * GET /api/v1/permissions/grouped
     *
     * Returns permissions organized by module (extracted from permission name).
     * Format: { "users": [...], "sites": [...], "quotes": [...] }
     */
    public function getGrouped(): JsonResponse
    {
        $this->authorize('viewAny', Permission::class);

        $grouped = $this->permissionService->getGrouped()->map(function ($group) {
            return PermissionData::collect($group->map(function ($permission) {
                $parts = explode('.', $permission->name, 2);

                return array_merge(
                    $permission->toArray(),
                    [
                        'module' => $parts[0] ?? '',
                        'action' => $parts[1] ?? '',
                        'display_name' => $permission->display_name ?? $permission->name,
                        'description' => $permission->description,
                    ]
                );
            }));
        });

        return response()->json([
            'success' => true,
            'data' => $grouped,
        ]);
    }
}
