<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Product\CreateProductAction;
use App\Actions\Product\DeleteProductAction;
use App\Actions\Product\UpdateProductAction;
use App\Data\ProductData;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Queries\Product\GetProductsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Spatie\LaravelData\PaginatedDataCollection;

class ProductController extends Controller
{
    public function __construct(
        private readonly CreateProductAction $createAction,
        private readonly UpdateProductAction $updateAction,
        private readonly DeleteProductAction $deleteAction
    ) {}

    /**
     * Display a listing of products
     * Uses Query Class for complex filtering - follows AI_ARCHITECTURE_RULES.md
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $filters = $request->only([
            'is_active',
            'category',
            'category_id',
            'product_type',
            'rentable',
            'composites',
            'low_stock',
            'search',
            'barcode',
            'semantic_search',
            'sort_field',
            'sort_direction',
        ]);

        $perPage = min($request->input('per_page', 20), 100);

        $products = GetProductsQuery::execute($filters, $perPage);

        // Convert paginated items to DTOs
        return response()->json([
            'success' => true,
            ...ProductData::collect($products->items(), PaginatedDataCollection::class)->toArray(),
        ]);
    }

    /**
     * Store a newly created product
     * Uses Action pattern - follows AI_ARCHITECTURE_RULES.md
     */
    public function store(ProductData $data): JsonResponse
    {
        $this->authorize('create', Product::class);

        $product = $this->createAction->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => ProductData::from($product),
        ], 201);
    }

    /**
     * Display the specified product
     */
    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        // Load relationships for complete data
        $product->load([
            'category',
            'defaultSupplier',
            'relations',
        ]);

        return response()->json([
            'success' => true,
            'data' => ProductData::from($product),
        ]);
    }

    /**
     * Update the specified product
     * Uses Action pattern - follows AI_ARCHITECTURE_RULES.md
     */
    public function update(Product $product, Request $request): JsonResponse
    {
        $this->authorize('update', $product);

        $request['id'] = $product->id; // Ensure ID is set for validation

        $data = ProductData::from($request);

        $updated = $this->updateAction->execute($product, $data);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => ProductData::from($updated),
        ]);
    }

    /**
     * Remove the specified product
     * Uses Action pattern - follows AI_ARCHITECTURE_RULES.md
     */
    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $this->deleteAction->execute($product);

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }

    /**
     * Get products needing reorder
     * Simple query - can stay in controller per AI_ARCHITECTURE_RULES.md
     */
    public function needingReorder(): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::query()
            ->whereColumn('reorder_level', '>', 0)
            ->whereRaw('(SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE inventory.product_id = products.id) <= products.reorder_level')
            ->with(['category', 'defaultSupplier'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProductData::collect($products),
        ]);
    }

    /**
     * Calculate price for composite product
     * Uses Model methods - follows AI_ARCHITECTURE_RULES.md
     */
    public function calculatePrice(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $salePrice = $product->calculateCompositeSalePrice();
        $cost = $product->calculateCompositeCost();

        return response()->json([
            'success' => true,
            'data' => [
                'sale_price' => $salePrice,
                'cost' => $cost,
                'margin' => $salePrice - $cost,
                'margin_percentage' => $cost > 0 ? (($salePrice - $cost) / $cost) * 100 : 0,
            ],
        ]);
    }
}
