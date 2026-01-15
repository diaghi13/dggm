<?php

namespace App\Policies;

use App\Models\MaterialRequest;
use App\Models\Site;
use App\Models\User;

class MaterialRequestPolicy
{
    /**
     * Determine whether the user can view any material requests for a site.
     */
    public function viewAny(User $user, Site $site): bool
    {
        // Managers can view all requests
        if ($user->hasAnyRole(['SuperAdmin', 'Admin', 'ProjectManager', 'WarehouseManager'])) {
            return true;
        }

        // Workers can only view requests for sites they're assigned to
        if ($user->hasRole('Worker') && $user->worker) {
            return $site->workers()
                ->where('worker_id', $user->worker->id)
                ->whereIn('status', ['accepted', 'active'])
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can view the material request.
     */
    public function view(User $user, MaterialRequest $materialRequest): bool
    {
        // Managers can view all requests
        if ($user->hasAnyRole(['SuperAdmin', 'Admin', 'ProjectManager', 'WarehouseManager'])) {
            return true;
        }

        // Worker can view own requests
        if ($user->hasRole('Worker')) {
            return $materialRequest->requested_by_user_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can create material requests.
     */
    public function create(User $user): bool
    {
        // Only workers can create material requests
        return $user->hasRole('Worker') && $user->worker !== null;
    }

    /**
     * Determine whether the user can update the material request.
     */
    public function update(User $user, MaterialRequest $materialRequest): bool
    {
        // Only the requester can update, and only if pending
        return $materialRequest->requested_by_user_id === $user->id
            && $materialRequest->isPending();
    }

    /**
     * Determine whether the user can approve the material request.
     */
    public function approve(User $user, MaterialRequest $materialRequest): bool
    {
        // Only managers can approve
        if (! $user->hasAnyRole(['SuperAdmin', 'Admin', 'ProjectManager', 'WarehouseManager'])) {
            return false;
        }

        // Must be pending
        return $materialRequest->canBeApproved();
    }

    /**
     * Determine whether the user can reject the material request.
     */
    public function reject(User $user, MaterialRequest $materialRequest): bool
    {
        // Only managers can reject
        if (! $user->hasAnyRole(['SuperAdmin', 'Admin', 'ProjectManager', 'WarehouseManager'])) {
            return false;
        }

        // Must be pending
        return $materialRequest->canBeRejected();
    }

    /**
     * Determine whether the user can mark as delivered.
     */
    public function deliver(User $user, MaterialRequest $materialRequest): bool
    {
        // Only managers can mark as delivered
        if (! $user->hasAnyRole(['SuperAdmin', 'Admin', 'ProjectManager', 'WarehouseManager'])) {
            return false;
        }

        // Must be approved
        return $materialRequest->canBeDelivered();
    }

    /**
     * Determine whether the user can delete the material request.
     */
    public function delete(User $user, MaterialRequest $materialRequest): bool
    {
        // Requester can delete if pending
        if ($materialRequest->requested_by_user_id === $user->id && $materialRequest->isPending()) {
            return true;
        }

        // Managers can delete pending requests
        if ($user->hasAnyRole(['SuperAdmin', 'Admin', 'ProjectManager', 'WarehouseManager'])) {
            return $materialRequest->isPending();
        }

        return false;
    }
}
