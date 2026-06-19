<?php

namespace App\Domains\Product\Queries;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

readonly class GetProductBrandsQuery
{
    public function __construct(
        private array $filters = [],
        private ?int $perPage = null,
    ) {}

    public function execute(): Collection|\Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = \App\Domains\Product\Models\ProductBrand::query()
            ->when(isset($filters['is_active']),
                fn (Builder $q) => $q->where('is_active', filter_var($this->filters['is_active'], FILTER_VALIDATE_BOOLEAN))
            )
            ->when(
                ! empty($filters['search']),
                function (Builder $q) {
                    $search = $this->filters['search'];
                    $q->where(fn (Builder $q) => $q
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                    );
                }
            )
            ->orderBy($this->filters['sort_field'] ?? 'name', $this->filters['sort_direction'] ?? 'asc');

        return $this->perPage
            ? $query->paginate($this->perPage)
            : $query->get();
    }
}
