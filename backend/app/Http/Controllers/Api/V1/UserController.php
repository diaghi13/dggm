<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\UserData;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * User Controller
 *
 * Handles HTTP layer for user management.
 * Delegates business logic to UserService.
 */
class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    /**
     * Display a listing of users.
     *
     * GET /api/v1/users
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $filters = $request->only(['search', 'is_active', 'role']);
        $perPage = $request->integer('per_page', 15);

        $users = $this->userService->getAll($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => UserData::collect($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Store a newly created user.
     *
     * POST /api/v1/users
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        // Validate and create DTO
        $userData = UserData::from($request->all());

        // Validate password is present for creation
        if (! isset($userData->password) || empty($userData->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password is required for new users',
                'errors' => ['password' => ['The password field is required.']],
            ], 422);
        }

        // Validate password confirmation matches
        if ($userData->password !== $userData->password_confirmation) {
            return response()->json([
                'success' => false,
                'message' => 'Password confirmation does not match',
                'errors' => ['password_confirmation' => ['The password confirmation does not match.']],
            ], 422);
        }

        // Execute service
        $user = $this->userService->create($userData);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => UserData::from($user),
        ], 201);
    }

    /**
     * Display the specified user.
     *
     * GET /api/v1/users/{id}
     */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'success' => true,
            'data' => UserData::from($user->load(['roles.permissions', 'worker'])),
        ]);
    }

    /**
     * Update the specified user.
     *
     * PUT/PATCH /api/v1/users/{id}
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        // Validate and create DTO
        $userData = UserData::from($request->all());

        // Validate password confirmation if password is provided
        if (isset($userData->password) && ! empty($userData->password)) {
            if ($userData->password !== $userData->password_confirmation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password confirmation does not match',
                    'errors' => ['password_confirmation' => ['The password confirmation does not match.']],
                ], 422);
            }
        }

        // Execute service
        $user = $this->userService->update($user, $userData);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => UserData::from($user),
        ]);
    }

    /**
     * Remove the specified user.
     *
     * DELETE /api/v1/users/{id}
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        try {
            $this->userService->delete($user);

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Assign roles to user.
     *
     * POST /api/v1/users/{user}/roles
     */
    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        // Validate roles array
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user = $this->userService->assignRoles($user, $validated['roles']);

        return response()->json([
            'success' => true,
            'message' => 'Roles assigned successfully',
            'data' => UserData::from($user),
        ]);
    }

    /**
     * Revoke a role from user.
     *
     * DELETE /api/v1/users/{user}/roles/{role}
     */
    public function revokeRole(User $user, string $roleName): JsonResponse
    {
        $this->authorize('update', $user);

        $user = $this->userService->revokeRole($user, $roleName);

        return response()->json([
            'success' => true,
            'message' => 'Role revoked successfully',
            'data' => UserData::from($user),
        ]);
    }

    /**
     * Sync roles for user (bulk operation).
     *
     * POST /api/v1/users/{user}/sync-roles
     */
    public function syncRoles(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        // Validate roles array
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user = $this->userService->syncRoles($user, $validated['roles']);

        return response()->json([
            'success' => true,
            'message' => 'Roles synced successfully',
            'data' => UserData::from($user),
        ]);
    }
}
