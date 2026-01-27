<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Product\CreateProductRelationAction;
use App\Actions\Product\DeleteProductRelationAction;
use App\Actions\Product\UpdateProductRelationAction;
use App\Data\ProductRelationData;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductRelation;
use App\Queries\Product\CalculateProductRelationsQuery;
use App\Queries\Product\GetProductRelationsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use function Pest\Laravel\json;

class ProductRelationController extends Controller
{
    public function __construct(
        private readonly CreateProductRelationAction $createAction,
        private readonly UpdateProductRelationAction $updateAction,
        private readonly DeleteProductRelationAction $deleteAction
    )
    {
    }

    /**
     * Get all relations for a product
     */
    public function index(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $filters = $request->only([
            'relation_type_id',
            'visible_in_quote',
            'visible_in_material_list',
            'required_for_stock',
            'components_only',
            'dependencies_only',
        ]);

        $query = new GetProductRelationsQuery($product);
        $relations = $query->execute($filters);

        return response()->json([
            'success' => true,
            'data' => ProductRelationData::collect($relations),
        ]);
    }

    /**
     * Store a new product relation
     */
    public function store(Product $product, Request $request): JsonResponse
    {
        $this->authorize('update', $product);

        // Use fromRequest to handle defaults
        $data = ProductRelationData::from([
            ...$request->all(),
            'product_id' => $product->id,
        ]);

        $relation = $this->createAction->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'Product relation created successfully',
            'data' => ProductRelationData::from($relation),
        ], 201);
    }

    /**
     * Show a specific product relation
     */
    public function show(ProductRelation $productRelation): JsonResponse
    {
        $this->authorize('view', $productRelation->product);

        $productRelation->load(['product', 'relatedProduct', 'relationType']);

        return response()->json([
            'success' => true,
            'data' => ProductRelationData::from($productRelation),
        ]);
    }

    /**
     * Update a product relation
     */
    public function update(Product $product, ProductRelation $relation, Request $request): JsonResponse
    {
        $this->authorize('update', $product);

        // Ensure the relation belongs to this product
        if ($relation->product_id !== $product->id) {
            return response()->json([
                'success' => false,
                'message' => 'Relation does not belong to this product',
            ], 404);
        }
        $data = ProductRelationData::from([
            ...$request->all(),
            'product_id' => $product->id,
            'related_product_id' => $relation->related_product_id,
        ]);

        $updated = $this->updateAction->execute($relation, $data);

        return response()->json([
            'success' => true,
            'message' => 'Product relation updated successfully',
            'data' => ProductRelationData::from($updated),
        ]);
    }

    /**
     * Delete a product relation
     */
    public function destroy(Product $product, ProductRelation $relation): JsonResponse
    {
        $this->authorize('update', $product);

        // Ensure the relation belongs to this product
        if ($relation->product_id !== $product->id) {
            return response()->json([
                'success' => false,
                'message' => 'Relation does not belong to this product',
            ], 404);
        }

        $this->deleteAction->execute($relation);

        return response()->json([
            'success' => true,
            'message' => 'Product relation deleted successfully',
        ]);
    }

    /**
     * Calculate relations for a product with given quantity
     * Returns 3 lists: quote, material, stock
     */
    public function calculate(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $request->validate([
            'quantity' => 'required|numeric|min:0',
        ]);

        $query = new CalculateProductRelationsQuery($product);
        $result = $query->execute($request->input('quantity'));

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Get quote list for a product (LISTA 1)
     */
    public function quoteList(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $request->validate([
            'quantity' => 'required|numeric|min:0',
        ]);

        $query = new CalculateProductRelationsQuery($product);
        $list = $query->getQuoteList($request->input('quantity'));

        return response()->json([
            'success' => true,
            'data' => $list,
        ]);
    }

    /**
     * Get material list for a product (LISTA 2)
     */
    public function materialList(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $request->validate([
            'quantity' => 'required|numeric|min:0',
        ]);

        $query = new CalculateProductRelationsQuery($product);
        $list = $query->getMaterialList($request->input('quantity'));

        return response()->json([
            'success' => true,
            'data' => $list,
        ]);
    }

    /**
     * Get stock list for a product (LISTA 3)
     */
    public function stockList(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $request->validate([
            'quantity' => 'required|numeric|min:0',
        ]);

        $query = new CalculateProductRelationsQuery($product);
        $list = $query->getStockList($request->input('quantity'));

        return response()->json([
            'success' => true,
            'data' => $list,
        ]);
    }
}
