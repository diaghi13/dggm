<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\PriceListItemData;
use App\Enums\ProductType;
use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use App\Services\ProductPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceListItemController extends Controller
{
    public function __construct(
        private readonly ProductPricingService $pricingService
    ) {}

    /**
     * Get paginated price list items with products
     */
    public function index(Request $request, PriceList $priceList): JsonResponse
    {
        $this->authorize('view', $priceList);

        $perPage = min($request->input('per_page', 100), 500);
        $search = $request->input('search');
        $isActive = $request->input('is_active');
        $isManualPrice = $request->input('is_manual_price');
        $productType = $request->input('product_type');

        $query = $priceList->items()
            ->join('products', 'price_list_items.product_id', '=', 'products.id')
            ->select('price_list_items.*') // Select only price_list_items columns
            ->with(['product.category', 'product.brand'])
            // Search filter
            ->when($search, function ($q) use ($search) {
                $q->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('products.name', 'like', "%{$search}%")
                        ->orWhere('products.code', 'like', "%{$search}%");
                });
            })
            // Active/Inactive filter
            ->when($isActive !== null, function ($q) use ($isActive) {
                $q->where('price_list_items.is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
            })
            // Manual/Automatic price filter
            ->when($isManualPrice !== null, function ($q) use ($isManualPrice) {
                $q->where('price_list_items.is_manual_price', filter_var($isManualPrice, FILTER_VALIDATE_BOOLEAN));
            })
            // Product type filter (article, service, composite)
            ->when($productType, function ($q) use ($productType) {
                $q->where('products.product_type', $productType);
            })
            ->orderBy('products.name');

        $items = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => PriceListItemData::collect($items->items(), \Spatie\LaravelData\DataCollection::class),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
            'links' => [
                'first' => $items->url(1),
                'last' => $items->url($items->lastPage()),
                'prev' => $items->previousPageUrl(),
                'next' => $items->nextPageUrl(),
            ],
        ]);
    }

    /**
     * Add a new item to the price list
     */
    public function store(Request $request, PriceList $priceList): JsonResponse
    {
        $this->authorize('update', $priceList);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'sale_price' => 'required|numeric|min:0',
            'is_manual_price' => 'nullable|boolean',
            'rental_hourly' => 'nullable|numeric|min:0',
            'rental_half_day' => 'nullable|numeric|min:0',
            'rental_daily' => 'nullable|numeric|min:0',
            'rental_weekly' => 'nullable|numeric|min:0',
            'rental_monthly' => 'nullable|numeric|min:0',
            'rental_seasonal' => 'nullable|numeric|min:0',
            'is_manual_rental' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        // Check if item already exists
        $existing = PriceListItem::where('price_list_id', $priceList->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Product already exists in this price list',
            ], 422);
        }

        // Set defaults for nullable boolean fields
        $validated['is_manual_price'] = $validated['is_manual_price'] ?? false;
        $validated['is_manual_rental'] = $validated['is_manual_rental'] ?? false;
        $validated['is_active'] = $validated['is_active'] ?? true;

        // Services are not rentable — force all rental fields to null
        $product = Product::findOrFail($validated['product_id']);
        if ($product->product_type === ProductType::SERVICE) {
            $validated['rental_hourly'] = null;
            $validated['rental_half_day'] = null;
            $validated['rental_daily'] = null;
            $validated['rental_weekly'] = null;
            $validated['rental_monthly'] = null;
            $validated['rental_seasonal'] = null;
            $validated['is_manual_rental'] = false;
        }

        $item = PriceListItem::create([
            'price_list_id' => $priceList->id,
            ...$validated,
        ]);

        return response()->json([
            'success' => true,
            'data' => PriceListItemData::from($item->load('product')),
            'message' => 'Item added to price list successfully',
        ], 201);
    }

    /**
     * Update an existing item in the price list
     */
    public function update(Request $request, PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $this->authorize('update', $priceList);

        // Verify item belongs to this price list
        if ($item->price_list_id !== $priceList->id) {
            return response()->json([
                'success' => false,
                'message' => 'Item does not belong to this price list',
            ], 404);
        }

        $validated = $request->validate([
            'sale_price' => 'required|numeric|min:0',
            'is_manual_price' => 'nullable|boolean',
            'rental_hourly' => 'nullable|numeric|min:0',
            'rental_half_day' => 'nullable|numeric|min:0',
            'rental_daily' => 'nullable|numeric|min:0',
            'rental_weekly' => 'nullable|numeric|min:0',
            'rental_monthly' => 'nullable|numeric|min:0',
            'rental_seasonal' => 'nullable|numeric|min:0',
            'is_manual_rental' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        // Set defaults for NOT NULL boolean fields to prevent constraint violations
        $validated['is_manual_price'] = $validated['is_manual_price'] ?? $item->is_manual_price;
        $validated['is_manual_rental'] = $validated['is_manual_rental'] ?? $item->is_manual_rental;
        $validated['is_active'] = $validated['is_active'] ?? $item->is_active;

        // Capture is_manual_rental before update (may change in $validated)
        $wasManualRental = (bool) $validated['is_manual_rental'];

        $item->update($validated);

        // Force rental fields to null for SERVICE products regardless of manual flag
        $item->loadMissing('product');
        if ($item->product->product_type === ProductType::SERVICE) {
            $item->update([
                'rental_hourly' => null,
                'rental_half_day' => null,
                'rental_daily' => null,
                'rental_weekly' => null,
                'rental_monthly' => null,
                'rental_seasonal' => null,
            ]);
        } elseif (! $wasManualRental && isset($validated['sale_price'])) {
            // Ricalcola rental se non manuale e sale_price è cambiato
            $item->loadMissing('priceList');
            $itemData = $item->priceList->calculation_mode->value === 'automatic'
                ? $this->pricingService->generateAutomaticPriceListItem($item->product, $item->priceList)
                : $this->pricingService->generateManualPriceListItem($item->product);

            $item->update([
                'rental_hourly' => $itemData['rental_hourly'],
                'rental_half_day' => $itemData['rental_half_day'],
                'rental_daily' => $itemData['rental_daily'],
                'rental_weekly' => $itemData['rental_weekly'],
                'rental_monthly' => $itemData['rental_monthly'],
                'rental_seasonal' => $itemData['rental_seasonal'],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => PriceListItemData::from($item->fresh('product')),
            'message' => 'Price list item updated successfully',
        ]);
    }

    /**
     * Remove an item from the price list
     */
    public function destroy(PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $this->authorize('update', $priceList);

        // Verify item belongs to this price list
        if ($item->price_list_id !== $priceList->id) {
            return response()->json([
                'success' => false,
                'message' => 'Item does not belong to this price list',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item removed from price list successfully',
        ]);
    }

    /**
     * Recalculate item price based on price list settings
     */
    public function recalculate(PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $this->authorize('update', $priceList);

        // Verify item belongs to this price list
        if ($item->price_list_id !== $priceList->id) {
            return response()->json([
                'success' => false,
                'message' => 'Item does not belong to this price list',
            ], 404);
        }

        $product = Product::findOrFail($item->product_id);

        // Regenerate prices based on price list mode
        $itemData = $priceList->calculation_mode->value === 'automatic'
            ? $this->pricingService->generateAutomaticPriceListItem($product, $priceList)
            : $this->pricingService->generateManualPriceListItem($product);

        $item->update($itemData);

        return response()->json([
            'success' => true,
            'data' => PriceListItemData::from($item->fresh('product')),
            'message' => 'Item price recalculated successfully',
        ]);
    }
}
