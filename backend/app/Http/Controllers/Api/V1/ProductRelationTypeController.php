<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ProductRelationTypeData;
use App\Http\Controllers\Controller;
use App\Models\ProductRelationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductRelationTypeController extends Controller
{
    /**
     * Get all product relation types
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ProductRelationType::class);

        $query = ProductRelationType::query();

        // Filter: active only
        if ($request->has('active_only') && filter_var($request->input('active_only'), FILTER_VALIDATE_BOOLEAN)) {
            $query->active();
        }

        $types = $query->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => ProductRelationTypeData::collect($types),
        ]);
    }

    /**
     * Store a new product relation type
     */
    public function store(ProductRelationTypeData $data): JsonResponse
    {
        $this->authorize('create', ProductRelationType::class);

        $type = ProductRelationType::create($data->except('id')->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Product relation type created successfully',
            'data' => ProductRelationTypeData::from($type),
        ], 201);
    }

    /**
     * Show a specific product relation type
     */
    public function show(ProductRelationType $productRelationType): JsonResponse
    {
        $this->authorize('view', $productRelationType);

        return response()->json([
            'success' => true,
            'data' => ProductRelationTypeData::from($productRelationType),
        ]);
    }

    /**
     * Update a product relation type
     */
    public function update(ProductRelationType $productRelationType, ProductRelationTypeData $data): JsonResponse
    {
        $this->authorize('update', $productRelationType);

        $productRelationType->update($data->except('id')->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Product relation type updated successfully',
            'data' => ProductRelationTypeData::from($productRelationType->fresh()),
        ]);
    }

    /**
     * Delete a product relation type
     */
    public function destroy(ProductRelationType $productRelationType): JsonResponse
    {
        $this->authorize('delete', $productRelationType);

        // Check if type is used in any relations
        if ($productRelationType->relations()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete product relation type that is in use',
            ], 422);
        }

        $productRelationType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product relation type deleted successfully',
        ]);
    }
}
