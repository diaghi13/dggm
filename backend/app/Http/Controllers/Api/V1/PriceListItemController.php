<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\PriceListItemData;
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
     * Add a new item to the price list
     */
    public function store(Request $request, PriceList $priceList): JsonResponse
    {
        $this->authorize('update', $priceList);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'sale_price' => 'required|numeric|min:0',
            'is_manual_price' => 'nullable|boolean',
            'rental_daily' => 'nullable|numeric|min:0',
            'rental_weekly' => 'nullable|numeric|min:0',
            'rental_monthly' => 'nullable|numeric|min:0',
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
            'rental_daily' => 'nullable|numeric|min:0',
            'rental_weekly' => 'nullable|numeric|min:0',
            'rental_monthly' => 'nullable|numeric|min:0',
            'is_manual_rental' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $item->update($validated);

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
