<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\WarrantyType\CreateWarrantyTypeAction;
use App\Actions\WarrantyType\DeleteWarrantyTypeAction;
use App\Actions\WarrantyType\UpdateWarrantyTypeAction;
use App\Data\WarrantyTypeData;
use App\Http\Controllers\Controller;
use App\Models\WarrantyType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarrantyTypeController extends Controller
{
    public function __construct(
        private readonly CreateWarrantyTypeAction $createAction,
        private readonly UpdateWarrantyTypeAction $updateAction,
        private readonly DeleteWarrantyTypeAction $deleteAction
    ) {}

    /**
     * Display a listing of warranty types
     * Simple query - stays in controller per ARCHITECTURE.md
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', WarrantyType::class);

        $query = WarrantyType::query();

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by search term
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Order by sort_order and name
        $query->ordered();

        $warrantyTypes = $query->get();

        return response()->json([
            'success' => true,
            'data' => WarrantyTypeData::collect($warrantyTypes),
        ]);
    }

    /**
     * Store a newly created warranty type
     * Uses Action pattern - follows ARCHITECTURE.md
     */
    public function store(WarrantyTypeData $data): JsonResponse
    {
        $this->authorize('create', WarrantyType::class);

        $warrantyType = $this->createAction->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'Warranty type created successfully',
            'data' => WarrantyTypeData::from($warrantyType),
        ], 201);
    }

    /**
     * Display the specified warranty type
     */
    public function show(WarrantyType $warrantyType): JsonResponse
    {
        $this->authorize('view', $warrantyType);

        return response()->json([
            'success' => true,
            'data' => WarrantyTypeData::from($warrantyType),
        ]);
    }

    /**
     * Update the specified warranty type
     * Uses Action pattern - follows ARCHITECTURE.md
     */
    public function update(WarrantyType $warrantyType, Request $request): JsonResponse
    {
        $this->authorize('update', $warrantyType);

        $request['id'] = $warrantyType->id; // Ensure ID is set for validation

        $data = WarrantyTypeData::from($request->all());
        $updated = $this->updateAction->execute($warrantyType, $data);

        return response()->json([
            'success' => true,
            'message' => 'Warranty type updated successfully',
            'data' => WarrantyTypeData::from($updated),
        ]);
    }

    /**
     * Remove the specified warranty type
     * Uses Action pattern - follows ARCHITECTURE.md
     */
    public function destroy(WarrantyType $warrantyType): JsonResponse
    {
        $this->authorize('delete', $warrantyType);

        $this->deleteAction->execute($warrantyType);

        return response()->json([
            'success' => true,
            'message' => 'Warranty type deleted successfully',
        ]);
    }

    /**
     * Get the default warranty type
     * Simple query - stays in controller per ARCHITECTURE.md
     */
    public function getDefault(): JsonResponse
    {
        $this->authorize('viewAny', WarrantyType::class);

        $defaultWarrantyType = WarrantyType::getDefault();

        if (! $defaultWarrantyType) {
            return response()->json([
                'success' => false,
                'message' => 'No default warranty type found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => WarrantyTypeData::from($defaultWarrantyType),
        ]);
    }
}
