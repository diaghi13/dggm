<?php

namespace App\Http\Controllers\Api\V1\Products;

use App\Domains\Product\Data\ProductBrandData;
use App\Domains\Product\Models\ProductBrand;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductBrandController extends Controller
{
    /**
     * Display a listing of product brands
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min($request->integer('per_page', 20), 100);
        $brands = app(\App\Domains\Product\Queries\GetProductBrandsQuery::class, [
            'filters' => $request->only(['is_active', 'search', 'sort_field', 'sort_direction']),
            'perPage' => $perPage,
        ])->execute();

        return response()->json([
            'success' => true,
            ...ProductBrandData::collect($brands, \Spatie\LaravelData\PaginatedDataCollection::class)->toArray(),
        ]);
    }

    /**
     * Store a newly created product brand
     */
    public function store(ProductBrandData $data): JsonResponse
    {
        $brand = ProductBrand::create($data->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Brand created successfully',
            'data' => ProductBrandData::from($brand),
        ], 201);
    }

    /**
     * Display the specified product brand
     */
    public function show(ProductBrand $productBrand): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ProductBrandData::from($productBrand),
        ]);
    }

    /**
     * Update the specified product brand
     */
    public function update(ProductBrandData $data, ProductBrand $productBrand): JsonResponse
    {
        $productBrand->update($data->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Brand updated successfully',
            'data' => ProductBrandData::from($productBrand->fresh()),
        ]);
    }

    /**
     * Remove the specified product brand
     */
    public function destroy(ProductBrand $productBrand): JsonResponse
    {
        // Check if brand has products
        if ($productBrand->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete brand with associated products',
            ], 422);
        }

        $productBrand->delete();

        return response()->json([
            'success' => true,
            'message' => 'Brand deleted successfully',
        ]);
    }
}
