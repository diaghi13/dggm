<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ProductBrandData;
use App\Http\Controllers\Controller;
use App\Models\ProductBrand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductBrandController extends Controller
{
    /**
     * Display a listing of product brands
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProductBrand::query();

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search by name or code
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = min($request->input('per_page', 20), 100);
        $brands = $query->paginate($perPage);

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
