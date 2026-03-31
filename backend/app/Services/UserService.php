<?php

namespace App\Services;

use App\Data\UserData;
use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * User Service
 *
 * Handles all user-related business logic.
 * Delegates to User model for data access.
 */
class UserService
{
    /**
     * Get all users with optional filters
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()->with('roles');

        // Search filter
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Status filter
        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        // Role filter
        if (! empty($filters['role'])) {
            $query->role($filters['role']);
        }

        return $query->orderBy('name')->paginate(min($perPage, 100));
    }

    /**
     * Get single user by ID
     */
    public function getById(int $id): ?User
    {
        return User::with(['roles.permissions', 'worker'])->find($id);
    }

    /**
     * Create new user
     */
    public function create(UserData $data): User
    {
        // Create or find GlobalUser in landlord DB (outside tenant transaction)
        $globalUser = GlobalUser::firstOrCreate(
            ['email' => $data->email],
            [
                'name' => $data->name,
                'password' => $data->password, // GlobalUser model handles hashing via cast
            ]
        );

        // Create TenantMembership if not exists
        $tenantId = tenancy()->tenant?->id;
        $primaryRole = ! empty($data->roles) ? $data->roles[0] : 'admin';
        if ($tenantId) {
            TenantMembership::firstOrCreate(
                ['global_user_id' => $globalUser->id, 'tenant_id' => $tenantId],
                ['role' => strtolower($primaryRole), 'status' => 'active']
            );
        }

        return DB::transaction(function () use ($data, $globalUser) {
            // Create user
            $user = User::create([
                'name' => $data->name,
                'email' => $data->email,
                'password' => Hash::make($data->password),
                'is_active' => $data->is_active,
                'global_user_id' => $globalUser->id,
            ]);

            // Assign roles if provided
            if (! empty($data->roles)) {
                $user->syncRoles($data->roles);
            }

            return $user->fresh(['roles.permissions', 'worker']);
        });
    }

    /**
     * Update existing user
     */
    public function update(User $user, UserData $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            // Update basic info
            $updateData = [
                'name' => $data->name,
                'email' => $data->email,
                'is_active' => $data->is_active,
            ];

            // Update password only if provided
            if (! ($data->password instanceof \Spatie\LaravelData\Optional) && ! empty($data->password)) {
                $updateData['password'] = Hash::make($data->password);
            }

            $user->update($updateData);

            // Sync roles if provided
            if (isset($data->roles)) {
                $user->syncRoles($data->roles);
            }

            return $user->fresh(['roles.permissions', 'worker']);
        });
    }

    /**
     * Delete user
     */
    public function delete(User $user): bool
    {
        return DB::transaction(function () use ($user) {
            // Remove all roles
            $user->syncRoles([]);

            // Delete user
            return $user->delete();
        });
    }

    /**
     * Assign roles to user
     */
    public function assignRoles(User $user, array $roleNames): User
    {
        $user->assignRole($roleNames);

        return $user->fresh(['roles.permissions']);
    }

    /**
     * Revoke role from user
     */
    public function revokeRole(User $user, string $roleName): User
    {
        $user->removeRole($roleName);

        return $user->fresh(['roles.permissions']);
    }

    /**
     * Sync roles for user (replaces all existing roles)
     */
    public function syncRoles(User $user, array $roleNames): User
    {
        $user->syncRoles($roleNames);

        return $user->fresh(['roles.permissions']);
    }
}
