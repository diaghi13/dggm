<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\PriceList\GeneratePriceListAction;
use App\Data\PriceListData;
use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Queries\PriceList\GetActivePriceListsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceListController extends Controller
{
    /**
     * Get all active price lists
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', PriceList::class);

        $priceLists = app(GetActivePriceListsQuery::class)->execute();

        return response()->json([
            'success' => true,
            'data' => PriceListData::collect($priceLists),
        ]);
    }

    /**
     * Get single price list with items
     */
    public function show(PriceList $priceList): JsonResponse
    {
        $this->authorize('view', $priceList);

        $priceList->load(['items.product', 'category']);

        return response()->json([
            'success' => true,
            'data' => PriceListData::from($priceList),
        ]);
    }

    /**
     * Create new price list
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', PriceList::class);

        $data = PriceListData::from($request);
        $generateItems = $request->boolean('generate_items', true);

        $priceList = app(GeneratePriceListAction::class)->execute($data, $generateItems);

        return response()->json([
            'success' => true,
            'data' => PriceListData::from($priceList),
            'message' => 'Price list created successfully',
        ], 201);
    }

    /**
     * Update price list
     */
    public function update(Request $request, PriceList $priceList): JsonResponse
    {
        $this->authorize('update', $priceList);

        $data = PriceListData::from($request);
        $priceList->update($data->except('id', 'items')->toArray());

        return response()->json([
            'success' => true,
            'data' => PriceListData::from($priceList->fresh()),
            'message' => 'Price list updated successfully',
        ]);
    }

    /**
     * Delete price list
     */
    public function destroy(PriceList $priceList): JsonResponse
    {
        $this->authorize('delete', $priceList);

        $priceList->delete();

        return response()->json([
            'success' => true,
            'message' => 'Price list deleted successfully',
        ]);
    }

    /**
     * Regenerate price list items
     */
    public function regenerate(PriceList $priceList): JsonResponse
    {
        $this->authorize('update', $priceList);

        // Delete and regenerate all items
        $priceList->items()->delete();

        $data = PriceListData::from($priceList);
        $priceList = app(GeneratePriceListAction::class)->execute($data, true);

        return response()->json([
            'success' => true,
            'data' => PriceListData::from($priceList),
            'message' => 'Price list regenerated successfully',
        ]);
    }
}
