<?php

namespace App\Services;

class UserService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function getAll(array $filters = [], int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query = \App\Models\User::query();

        return $query->paginate(min($perPage, 100));
    }
}
