<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\PriceList\GeneratePriceListAction;
use App\Data\PriceListData;
use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use App\Queries\PriceList\GetActivePriceListsQuery;
use App\Services\ProductPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceListController extends Controller
{
    /**
     * Get all active price lists with pagination support
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', PriceList::class);

        $perPage = min($request->input('per_page', 15), 100);
        $productId = $request->input('product_id');

        $priceLists = app(GetActivePriceListsQuery::class, [
            'productId' => $productId,
            'perPage' => $perPage,
        ])->execute();

        // Handle paginated response
        if ($priceLists instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
            return response()->json([
                'success' => true,
                'data' => PriceListData::collect($priceLists->items(), \Spatie\LaravelData\DataCollection::class),
                'meta' => [
                    'current_page' => $priceLists->currentPage(),
                    'per_page' => $priceLists->perPage(),
                    'total' => $priceLists->total(),
                    'last_page' => $priceLists->lastPage(),
                ],
                'links' => [
                    'first' => $priceLists->url(1),
                    'last' => $priceLists->url($priceLists->lastPage()),
                    'prev' => $priceLists->previousPageUrl(),
                    'next' => $priceLists->nextPageUrl(),
                ],
            ]);
        }

        // Non-paginated response
        return response()->json([
            'success' => true,
            'data' => PriceListData::collect($priceLists, \Spatie\LaravelData\DataCollection::class),
        ]);
    }

    /**
     * Get default price list
     *
     * Returns the active default price list that is currently valid
     */
    public function getDefault(): JsonResponse
    {
        $this->authorize('viewAny', PriceList::class);

        $pricingService = app(ProductPricingService::class);
        $defaultPriceList = $pricingService->getDefaultPriceList();

        if (! $defaultPriceList) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'No default price list found',
                    'code' => 'NO_DEFAULT_PRICE_LIST',
                ],
            ], 404);
        }

        // Load category and items count
        $defaultPriceList->load(['category'])
            ->loadCount('items');

        return response()->json([
            'success' => true,
            'data' => PriceListData::from($defaultPriceList),
        ]);
    }

    /**
     * Get single price list with basic info (without items)
     * Use GET /price-lists/{id}/items for paginated items
     */
    public function show(PriceList $priceList): JsonResponse
    {
        $this->authorize('view', $priceList);

        // Load only category and items count, NOT all items (too heavy - 13k+ items!)
        $priceList->load(['category'])
            ->loadCount('items');

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

        $request['id'] = $priceList->id; // Ensure ID is set for validation

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

        // Delete existing items
        $priceList->items()->delete();

        $itemsCreated = 0;

        // Get products filtered by category if specified
        $products = Product::query()
            ->where('is_active', true)
            ->when($priceList->category_id, fn ($q) => $q->where('category_id', $priceList->category_id))
            ->get();

        $pricingService = app(ProductPricingService::class);

        // Generate items based on calculation mode
        foreach ($products as $product) {
            $itemData = $priceList->calculation_mode->value === 'automatic'
                ? $pricingService->generateAutomaticPriceListItem($product, $priceList)
                : $pricingService->generateManualPriceListItem($product);

            PriceListItem::create([
                'price_list_id' => $priceList->id,
                'product_id' => $product->id,
                ...$itemData,
            ]);

            $itemsCreated++;
        }

        return response()->json([
            'success' => true,
            'data' => PriceListData::from($priceList->fresh(['items', 'category'])),
            'message' => "Price list regenerated successfully with $itemsCreated items",
        ]);
    }
}
