<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Product\BulkUpdateProductPricesAction;
use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Models\Product;
use App\Queries\Product\GetProductWithPricesQuery;
use App\Services\ProductPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductPricingController extends Controller
{
    public function __construct(
        private readonly ProductPricingService $pricingService
    ) {}

    /**
     * Get product with all pricing information
     */
    public function show(Product $product, Request $request): JsonResponse
    {
        $this->authorize('view', $product);

        $priceListId = $request->integer('price_list_id') ?: null;
        $quoteType = $request->string('quote_type')->value() ?: null;
        $durationDays = $request->integer('duration_days') ?: null;

        $product = app(GetProductWithPricesQuery::class, [
            'productId' => $product->id,
            'priceListId' => $priceListId,
        ])->execute();

        $priceList = $priceListId ? PriceList::find($priceListId) : null;

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'effective_price' => $this->pricingService->getEffectivePrice(
                    $product,
                    $priceList,
                    $quoteType,
                    $durationDays
                ),
            ],
        ]);
    }

    /**
     * Bulk update product prices
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $this->authorize('update', Product::class);

        $filters = $request->input('filters', []);
        $adjustment = $request->input('adjustment', []);

        $result = app(BulkUpdateProductPricesAction::class)->execute($filters, $adjustment);

        return response()->json([
            'success' => true,
            'data' => [
                'updated_count' => $result['updated'],
            ],
            'message' => "{$result['updated']} products updated successfully",
        ]);
    }

    /**
     * Preview bulk price adjustment
     */
    public function previewAdjustment(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $filters = $request->input('filters', []);
        $adjustmentType = $request->input('adjustment_type', 'percentage');
        $adjustmentValue = $request->input('adjustment_value', 0);

        // Get filtered products
        $query = Product::query()->active();

        if (isset($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        $products = $query->get();

        $preview = $this->pricingService->previewPriceAdjustment(
            $products,
            $adjustmentType,
            $adjustmentValue
        );

        return response()->json([
            'success' => true,
            'data' => $preview,
        ]);
    }
}
