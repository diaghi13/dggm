<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ProductCategoryData;
use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    /**
     * Get all product categories
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ProductCategory::class);

        $query = ProductCategory::query();

        // Filter: active only
        if ($request->has('active_only') && filter_var($request->input('active_only'), FILTER_VALIDATE_BOOLEAN)) {
            $query->active();
        }

        $categories = $query->with('rentalProfile')->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => ProductCategoryData::collect($categories),
        ]);
    }

    /**
     * Store a new product category
     */
    public function store(ProductCategoryData $data): JsonResponse
    {
        $this->authorize('create', ProductCategory::class);

        $category = ProductCategory::create($data->except('id', 'rentalProfile')->toArray());
        $category->load('rentalProfile');

        return response()->json([
            'success' => true,
            'message' => 'Product category created successfully',
            'data' => ProductCategoryData::from($category),
        ], 201);
    }

    /**
     * Show a specific product category
     */
    public function show(ProductCategory $productCategory): JsonResponse
    {
        $this->authorize('view', $productCategory);

        $productCategory->load('rentalProfile');

        return response()->json([
            'success' => true,
            'data' => ProductCategoryData::from($productCategory),
        ]);
    }

    /**
     * Update a product category
     */
    public function update(ProductCategory $productCategory, ProductCategoryData $data): JsonResponse
    {
        $this->authorize('update', $productCategory);

        $productCategory->update($data->except('id', 'rentalProfile')->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Product category updated successfully',
            'data' => ProductCategoryData::from($productCategory->fresh()->load('rentalProfile')),
        ]);
    }

    /**
     * Delete a product category
     */
    public function destroy(ProductCategory $productCategory): JsonResponse
    {
        $this->authorize('delete', $productCategory);

        // Check if category is used by any products
        if ($productCategory->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete product category that is in use',
            ], 422);
        }

        $productCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product category deleted successfully',
        ]);
    }
}
