<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\DiscountFamilyData;
use App\Http\Controllers\Controller;
use App\Models\DiscountFamily;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscountFamilyController extends Controller
{
    /**
     * Display a listing of discount families
     */
    public function index(Request $request): JsonResponse
    {
        $query = DiscountFamily::with('supplier');

        // Filter by supplier
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
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
        $families = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            ...DiscountFamilyData::collect($families, \Spatie\LaravelData\PaginatedDataCollection::class)->toArray(),
        ]);
    }

    /**
     * Store a newly created discount family
     */
    public function store(DiscountFamilyData $data): JsonResponse
    {
        $family = DiscountFamily::create($data->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Discount family created successfully',
            'data' => DiscountFamilyData::from($family),
        ], 201);
    }

    /**
     * Display the specified discount family
     */
    public function show(DiscountFamily $discountFamily): JsonResponse
    {
        $discountFamily->load('supplier');

        return response()->json([
            'success' => true,
            'data' => DiscountFamilyData::from($discountFamily),
        ]);
    }

    /**
     * Update the specified discount family
     */
    public function update(DiscountFamilyData $data, DiscountFamily $discountFamily): JsonResponse
    {
        $discountFamily->update($data->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Discount family updated successfully',
            'data' => DiscountFamilyData::from($discountFamily->fresh()),
        ]);
    }

    /**
     * Remove the specified discount family
     */
    public function destroy(DiscountFamily $discountFamily): JsonResponse
    {
        $discountFamily->delete();

        return response()->json([
            'success' => true,
            'message' => 'Discount family deleted successfully',
        ]);
    }
}
