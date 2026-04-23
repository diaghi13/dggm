<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Project\ResolveAvailabilityItemAction;
use App\Actions\Project\RunProjectAvailabilityCheckAction;
use App\Data\ProjectAvailabilityCheckData;
use App\Data\ResolveAvailabilityItemData;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectAvailabilityCheck;
use App\Models\ProjectAvailabilityCheckItem;
use App\Queries\Project\GetProjectAvailabilityCheckQuery;
use App\Queries\Project\GetProjectAvailabilityChecksQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectAvailabilityCheckController extends Controller
{
    /**
     * Run a new availability check for the given project.
     */
    public function run(Project $project): JsonResponse
    {
        $this->authorize('create', ProjectAvailabilityCheck::class);

        $check = app(RunProjectAvailabilityCheckAction::class)->execute($project);

        return response()->json([
            'success' => true,
            'message' => 'Availability check completed',
            'data' => ProjectAvailabilityCheckData::fromModel($check),
        ], 201);
    }

    /**
     * List all availability checks for the given project (paginated).
     */
    public function index(Project $project, Request $request): JsonResponse
    {
        $this->authorize('viewAny', ProjectAvailabilityCheck::class);

        $perPage = $request->get('per_page', 15);
        $paginator = app(GetProjectAvailabilityChecksQuery::class, [
            'project' => $project,
            'perPage' => (int) $perPage,
        ])->execute();

        $items = collect($paginator->items())
            ->map(fn ($check) => ProjectAvailabilityCheckData::fromModel($check))
            ->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Get the latest availability check for the given project.
     */
    public function latest(Project $project): JsonResponse
    {
        $this->authorize('viewAny', ProjectAvailabilityCheck::class);

        $check = app(GetProjectAvailabilityCheckQuery::class, ['project' => $project])->execute();

        if (! $check) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => ProjectAvailabilityCheckData::fromModel($check),
        ]);
    }

    /**
     * Resolve an individual availability check item.
     */
    public function resolveItem(ProjectAvailabilityCheckItem $item, Request $request): JsonResponse
    {
        $this->authorize('update', $item->availabilityCheck);

        $data = ResolveAvailabilityItemData::from($request);

        $item = app(ResolveAvailabilityItemAction::class)->execute($item, $data);

        return response()->json([
            'success' => true,
            'message' => 'Item resolved',
            'data' => \App\Data\ProjectAvailabilityCheckItemData::fromModel($item->load(['projectMaterial.product', 'subrentalSupplier'])),
        ]);
    }
}
