<?php

namespace App\Http\Controllers\Api\V1\FinalBilances;

use App\Actions\FinalBalance\AddFinalBalanceItemAction;
use App\Actions\FinalBalance\ApproveFinalBalanceAction;
use App\Actions\FinalBalance\CreateFinalBalanceAction;
use App\Actions\FinalBalance\DeleteFinalBalanceAction;
use App\Actions\FinalBalance\DeleteFinalBalanceItemAction;
use App\Actions\FinalBalance\FinalizeFinalBalanceAction;
use App\Actions\FinalBalance\GenerateFinalBalanceAction;
use App\Actions\FinalBalance\UpdateFinalBalanceAction;
use App\Actions\FinalBalance\UpdateFinalBalanceItemAction;
use App\Data\CreateFinalBalanceData;
use App\Data\CreateFinalBalanceItemData;
use App\Data\FinalBalanceData;
use App\Data\GenerateFinalBalanceData;
use App\Data\UpdateFinalBalanceData;
use App\Data\UpdateFinalBalanceItemData;
use App\Domains\Project\Models\Project;
use App\Http\Controllers\Controller;
use App\Models\FinalBalance;
use App\Models\FinalBalanceItem;
use App\Queries\FinalBalance\GetAllFinalBalancesQuery;
use App\Queries\FinalBalance\GetFinalBalanceWithItemsQuery;
use App\Queries\FinalBalance\GetProjectFinalBalancesQuery;
use App\Services\CodeGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinalBalanceController extends Controller
{
    public function __construct(
        private readonly CreateFinalBalanceAction $createAction,
        private readonly UpdateFinalBalanceAction $updateAction,
        private readonly DeleteFinalBalanceAction $deleteAction,
        private readonly GenerateFinalBalanceAction $generateAction,
        private readonly FinalizeFinalBalanceAction $finalizeAction,
        private readonly ApproveFinalBalanceAction $approveAction,
        private readonly AddFinalBalanceItemAction $addItemAction,
        private readonly UpdateFinalBalanceItemAction $updateItemAction,
        private readonly DeleteFinalBalanceItemAction $deleteItemAction
    ) {}

    /**
     * GET /final-balances — global paginated list
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinalBalance::class);

        $finalBalances = app(GetAllFinalBalancesQuery::class, [
            'filters' => $request->only('search', 'status', 'project_id', 'customer_id'),
        ])->execute($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => FinalBalanceData::collect($finalBalances->items()),
            'meta' => [
                'current_page' => $finalBalances->currentPage(),
                'per_page' => $finalBalances->perPage(),
                'total' => $finalBalances->total(),
                'last_page' => $finalBalances->lastPage(),
            ],
        ]);
    }

    /**
     * POST /final-balances — create blank
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', FinalBalance::class);

        $data = CreateFinalBalanceData::from($request);
        $finalBalance = $this->createAction->execute($data);

        return response()->json([
            'success' => true,
            'data' => FinalBalanceData::from($finalBalance),
        ], 201);
    }

    /**
     * GET /final-balances/{finalBalance} — show with all items
     */
    public function show(FinalBalance $finalBalance): JsonResponse
    {
        $this->authorize('view', $finalBalance);

        $finalBalance = app(GetFinalBalanceWithItemsQuery::class, ['finalBalance' => $finalBalance])->execute();

        return response()->json([
            'success' => true,
            'data' => FinalBalanceData::from($finalBalance),
        ]);
    }

    /**
     * PUT /final-balances/{finalBalance}
     */
    public function update(FinalBalance $finalBalance, Request $request): JsonResponse
    {
        $this->authorize('update', $finalBalance);

        $data = UpdateFinalBalanceData::from($request);
        $finalBalance = $this->updateAction->execute($finalBalance, $data);

        return response()->json([
            'success' => true,
            'data' => FinalBalanceData::from($finalBalance),
        ]);
    }

    /**
     * DELETE /final-balances/{finalBalance} — draft only
     */
    public function destroy(FinalBalance $finalBalance): JsonResponse
    {
        $this->authorize('delete', $finalBalance);

        $this->deleteAction->execute($finalBalance);

        return response()->json(['success' => true], 204);
    }

    /**
     * POST /final-balances/{finalBalance}/finalize
     */
    public function finalize(FinalBalance $finalBalance): JsonResponse
    {
        $this->authorize('finalize', $finalBalance);

        $finalBalance = $this->finalizeAction->execute($finalBalance);

        return response()->json([
            'success' => true,
            'data' => FinalBalanceData::from($finalBalance),
        ]);
    }

    /**
     * POST /final-balances/{finalBalance}/approve
     */
    public function approve(FinalBalance $finalBalance): JsonResponse
    {
        $this->authorize('approve', $finalBalance);

        $finalBalance = $this->approveAction->execute($finalBalance);

        return response()->json([
            'success' => true,
            'data' => FinalBalanceData::from($finalBalance),
        ]);
    }

    /**
     * GET /final-balances/next-number — preview next code
     */
    public function nextNumber(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinalBalance::class);

        $code = app(CodeGeneratorService::class)->generate('final_balance');

        return response()->json([
            'success' => true,
            'data' => ['code' => $code],
        ]);
    }

    /**
     * GET /projects/{project}/final-balances
     */
    public function indexByProject(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $finalBalances = app(GetProjectFinalBalancesQuery::class, ['project' => $project])->execute();

        return response()->json([
            'success' => true,
            'data' => FinalBalanceData::collect($finalBalances),
        ]);
    }

    /**
     * POST /projects/{project}/final-balances/generate
     */
    public function generate(Project $project, Request $request): JsonResponse
    {
        $this->authorize('create', FinalBalance::class);

        $data = GenerateFinalBalanceData::from($request);
        $finalBalance = $this->generateAction->execute($data, $project);

        return response()->json([
            'success' => true,
            'data' => FinalBalanceData::from($finalBalance),
        ], 201);
    }

    /**
     * POST /final-balances/{finalBalance}/items
     */
    public function storeItem(FinalBalance $finalBalance, Request $request): JsonResponse
    {
        $this->authorize('update', $finalBalance);

        $data = CreateFinalBalanceItemData::from($request);
        $item = $this->addItemAction->execute($finalBalance, $data);

        return response()->json([
            'success' => true,
            'data' => $item,
        ], 201);
    }

    /**
     * PUT /final-balance-items/{item}
     */
    public function updateItem(FinalBalanceItem $item, Request $request): JsonResponse
    {
        $this->authorize('update', $item->finalBalance);

        $data = UpdateFinalBalanceItemData::from($request);
        $item = $this->updateItemAction->execute($item, $data);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * DELETE /final-balance-items/{item}
     */
    public function destroyItem(FinalBalanceItem $item): JsonResponse
    {
        $this->authorize('update', $item->finalBalance);

        $this->deleteItemAction->execute($item);

        return response()->json(['success' => true], 204);
    }

    /**
     * PATCH /final-balance-items/{item}/reorder
     */
    public function reorderItem(FinalBalanceItem $item, Request $request): JsonResponse
    {
        $this->authorize('update', $item->finalBalance);

        $request->validate(['sort_order' => ['required', 'integer', 'min:0']]);

        $item->update(['sort_order' => $request->integer('sort_order')]);

        return response()->json([
            'success' => true,
            'data' => $item->fresh(),
        ]);
    }
}
