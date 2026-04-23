<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Inspection\CompleteInspectionItemAction;
use App\Actions\Inspection\FinalizeInspectionAction;
use App\Actions\Inspection\StartRentalReturnInspectionAction;
use App\Data\CompleteInspectionItemData;
use App\Data\RentalReturnInspectionData;
use App\Data\RentalReturnInspectionItemData;
use App\Http\Controllers\Controller;
use App\Models\Ddt;
use App\Models\RentalReturnInspection;
use App\Models\RentalReturnInspectionItem;
use App\Queries\Inspection\GetPendingRentalReturnInspectionsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RentalReturnInspectionController extends Controller
{
    /**
     * POST /ddts/{ddt}/inspection
     * Start a new rental return inspection for a DDT.
     */
    public function start(Ddt $ddt): JsonResponse
    {
        $this->authorize('create', RentalReturnInspection::class);

        abort_if(
            $ddt->inspection()->exists(),
            422,
            'An inspection already exists for this DDT.'
        );

        $inspection = app(StartRentalReturnInspectionAction::class)->execute($ddt);

        return response()->json([
            'success' => true,
            'data' => RentalReturnInspectionData::fromModel($inspection),
        ], 201);
    }

    /**
     * GET /ddts/{ddt}/inspection
     * Show the inspection for a DDT.
     */
    public function show(Ddt $ddt): JsonResponse
    {
        $inspection = $ddt->inspection()->with([
            'items.product',
            'items.warehouse',
            'inspectedBy',
            'project',
            'ddt',
        ])->firstOrFail();

        $this->authorize('view', $inspection);

        return response()->json([
            'success' => true,
            'data' => RentalReturnInspectionData::fromModel($inspection),
        ]);
    }

    /**
     * PATCH /inspection-items/{item}
     * Mark an inspection item as reviewed with condition, quantities, and action.
     */
    public function completeItem(RentalReturnInspectionItem $item, Request $request): JsonResponse
    {
        $this->authorize('update', $item->inspection);

        $updatedItem = app(CompleteInspectionItemAction::class)->execute(
            $item,
            CompleteInspectionItemData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => RentalReturnInspectionItemData::fromModel($updatedItem),
        ]);
    }

    /**
     * POST /inspections/{inspection}/finalize
     * Finalize an in-progress inspection (all items must be reviewed).
     */
    public function finalize(RentalReturnInspection $inspection): JsonResponse
    {
        $this->authorize('finalize', $inspection);

        abort_if(
            $inspection->isCompleted(),
            422,
            'Inspection is already completed.'
        );

        $inspection = app(FinalizeInspectionAction::class)->execute($inspection);

        return response()->json([
            'success' => true,
            'data' => RentalReturnInspectionData::fromModel($inspection->load('items.product', 'items.warehouse', 'inspectedBy', 'project', 'ddt')),
        ]);
    }

    /**
     * GET /inspections/pending
     * List all DDTs of type rental_return with no or in-progress inspection.
     */
    public function pending(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RentalReturnInspection::class);

        $ddts = app(GetPendingRentalReturnInspectionsQuery::class)->execute();

        return response()->json([
            'success' => true,
            'data' => $ddts->map(function ($ddt) {
                return [
                    'ddt_id' => $ddt->id,
                    'ddt_code' => $ddt->code,
                    'ddt_date' => $ddt->ddt_date?->format('Y-m-d'),
                    'project_id' => $ddt->project_id,
                    'project_name' => $ddt->project?->name,
                    'items_count' => $ddt->items->count(),
                    'inspection' => $ddt->inspection ? [
                        'id' => $ddt->inspection->id,
                        'status' => $ddt->inspection->status,
                        'inspection_date' => $ddt->inspection->inspection_date?->format('Y-m-d'),
                    ] : null,
                ];
            }),
            'meta' => [
                'total' => $ddts->count(),
            ],
        ]);
    }
}
