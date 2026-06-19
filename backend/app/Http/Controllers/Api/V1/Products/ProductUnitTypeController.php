<?php

namespace App\Http\Controllers\Api\V1\Products;

use App\Domains\Product\Data\ProductUnitTypeData;
use App\Domains\Product\Models\ProductUnitType;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductUnitTypeController extends Controller
{
    /**
     * Get all unit types (active only by default, pass ?all=true for management)
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProductUnitType::orderBy('category')->orderBy('sort_order');

        if (! $request->boolean('all')) {
            $query->active();
        }

        return response()->json([
            'success' => true,
            'data' => ProductUnitTypeData::collect($query->get()),
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

    /**
     * Store a new unit type
     */
    public function store(ProductUnitTypeData $data): JsonResponse
    {
        $this->authorize('create', ProductUnitType::class);

        $unitType = ProductUnitType::create($data->except('id')->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Unit type created successfully',
            'data' => ProductUnitTypeData::from($unitType),
        ], 201);
    }

    /**
     * Show a specific unit type
     */
    public function show(ProductUnitType $productUnitType): JsonResponse
    {
        $this->authorize('view', $productUnitType);

        return response()->json([
            'success' => true,
            'data' => ProductUnitTypeData::from($productUnitType),
        ]);
    }

    /**
     * Update a unit type (code is immutable after creation)
     */
    public function update(ProductUnitType $productUnitType, Request $request): JsonResponse
    {
        $this->authorize('update', $productUnitType);

        $validated = $request->validate([
            'name_it' => ['required', 'string', 'max:50'],
            'symbol_it' => ['required', 'string', 'max:10'],
            'name_en' => ['required', 'string', 'max:50'],
            'symbol_en' => ['required', 'string', 'max:10'],
            'aliases' => ['nullable', 'array'],
            'category' => ['nullable', 'string', 'max:20'],
            'conversion_factor' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $productUnitType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Unit type updated successfully',
            'data' => ProductUnitTypeData::from($productUnitType->fresh()),
        ]);
    }

    /**
     * Delete a unit type (only if not used by any products)
     */
    public function destroy(ProductUnitType $productUnitType): JsonResponse
    {
        $this->authorize('delete', $productUnitType);

        if ($productUnitType->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossibile eliminare: unità di misura in uso da prodotti.',
            ], 422);
        }

        $productUnitType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Unit type deleted successfully',
        ]);
    }
}
