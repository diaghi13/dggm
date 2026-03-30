<?php

namespace App\Policies;

use App\Models\KitAssembly;
use App\Models\User;

class KitAssemblyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('products.view');
    }

    public function view(User $user, KitAssembly $assembly): bool
    {
        return $user->can('products.view');
    }

    public function create(User $user): bool
    {
        return $user->can('products.create');
    }

    public function update(User $user, KitAssembly $assembly): bool
    {
        return $user->can('products.edit');
    }

    public function delete(User $user, KitAssembly $assembly): bool
    {
        return $user->can('products.delete');
    }

    public function disassemble(User $user, KitAssembly $assembly): bool
    {
        return $user->can('products.edit');
    }

    public function manageItems(User $user, KitAssembly $assembly): bool
    {
        return $user->can('products.edit');
    }
}
