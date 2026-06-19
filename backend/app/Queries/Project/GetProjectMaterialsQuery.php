<?php

namespace App\Queries\Project;

use App\Domains\Project\Models\ProjectMaterial;
use Illuminate\Database\Eloquent\Collection;

class GetProjectMaterialsQuery
{
    /**
     * Execute the query for project materials.
     *
     * @param  array{status?: string, is_extra?: bool, search?: string}  $filters
     */
    public static function execute(int $projectId, array $filters = []): Collection
    {
        $query = ProjectMaterial::query()
            ->where('project_id', $projectId)
            ->with(['product.category', 'quoteItem', 'requestedBy']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['is_extra'])) {
            $query->where('is_extra', filter_var($filters['is_extra'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('created_at', 'asc')->get();
    }
}
