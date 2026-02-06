<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ProductUnitTypeData;
use App\Http\Controllers\Controller;
use App\Models\ProductUnitType;
use Illuminate\Http\JsonResponse;

class ProductUnitTypeController extends Controller
{
    /**
     * Get all unit types
     */
    public function index(): JsonResponse
    {
        $units = ProductUnitType::active()
            ->orderBy('category')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProductUnitTypeData::collect($units),
        ]);
    }

    /**
     * Get units by category
     */
    public function byCategory(string $category): JsonResponse
    {
        $units = ProductUnitType::active()
            ->byCategory($category)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProductUnitTypeData::collect($units),
        ]);
    }
}
