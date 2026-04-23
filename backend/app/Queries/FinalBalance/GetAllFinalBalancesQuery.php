<?php

namespace App\Queries\FinalBalance;

use App\Models\FinalBalance;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetAllFinalBalancesQuery
{
    public function __construct(
        private readonly array $filters = []
    ) {}

    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return FinalBalance::query()
            ->with(['project', 'customer', 'createdBy'])
            ->when($this->filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('code', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($this->filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($this->filters['project_id'] ?? null, fn ($q, $projectId) => $q->where('project_id', $projectId))
            ->when($this->filters['customer_id'] ?? null, fn ($q, $customerId) => $q->where('customer_id', $customerId))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
}
