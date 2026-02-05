<?php

namespace App\Policies;

use App\Models\Setting;
use App\Models\User;

class SettingPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view settings (with filters)
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Setting $setting): bool
    {
        // Public settings can be viewed by anyone
        if ($setting->is_public) {
            return true;
        }

        // Global settings: only admins
        if ($setting->isGlobal()) {
            return $user->hasRole(['SuperAdmin', 'Admin']);
        }

        // User-specific settings: only owner or admins
        return $setting->user_id === $user->id || $user->hasRole(['SuperAdmin', 'Admin']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Admins can create any setting
        // Regular users can create their own user-specific settings
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Setting $setting): bool
    {
        // Global settings: only admins
        if ($setting->isGlobal()) {
            return $user->hasRole(['SuperAdmin', 'Admin']);
        }

        // User-specific settings: only owner or admins
        return $setting->user_id === $user->id || $user->hasRole(['SuperAdmin', 'Admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Setting $setting): bool
    {
        // Global settings: only admins
        if ($setting->isGlobal()) {
            return $user->hasRole(['SuperAdmin', 'Admin']);
        }

        // User-specific settings: only owner or admins
        return $setting->user_id === $user->id || $user->hasRole(['SuperAdmin', 'Admin']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Setting $setting): bool
    {
        return $user->hasRole(['SuperAdmin', 'Admin']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Setting $setting): bool
    {
        return $user->hasRole(['SuperAdmin', 'Admin']);
    }
}
