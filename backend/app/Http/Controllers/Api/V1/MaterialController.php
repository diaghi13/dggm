<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;
use App\Services\MaterialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function __construct(
        private readonly MaterialService $materialService
    ) {}

    /**
     * Display a listing of materials
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Material::class);

        $filters = $request->only([
            'is_active',
            'category',
            'product_type',
            'rentable',
            'kits',
            'low_stock',
            'search',
            'semantic_search',
            'sort_field',
            'sort_direction',
        ]);

        $perPage = min($request->input('per_page', 20), 100);

        $materials = $this->materialService->getAll($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => MaterialResource::collection($materials->items()),
            'meta' => [
                'current_page' => $materials->currentPage(),
                'last_page' => $materials->lastPage(),
                'per_page' => $materials->perPage(),
                'total' => $materials->total(),
            ],
        ]);
    }

    /**
     * Store a newly created material
     */
    public function store(StoreMaterialRequest $request): JsonResponse
    {
        $material = $this->materialService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Material created successfully',
            'data' => new MaterialResource($material),
        ], 201);
    }

    /**
     * Display the specified material
     */
    public function show(Material $material): JsonResponse
    {
        $this->authorize('view', $material);

        $material = $this->materialService->getById($material->id);

        return response()->json([
            'success' => true,
            'data' => new MaterialResource($material),
        ]);
    }

    /**
     * Update the specified material
     */
    public function update(UpdateMaterialRequest $request, Material $material): JsonResponse
    {
        $material = $this->materialService->update($material, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Material updated successfully',
            'data' => new MaterialResource($material),
        ]);
    }

    /**
     * Remove the specified material
     */
    public function destroy(Material $material): JsonResponse
    {
        $this->authorize('delete', $material);

        try {
            $this->materialService->delete($material);

            return response()->json([
                'success' => true,
                'message' => 'Material deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get materials needing reorder
     */
    public function needingReorder(): JsonResponse
    {
        $this->authorize('viewAny', Material::class);

        $materials = $this->materialService->getMaterialsNeedingReorder();

        return response()->json([
            'success' => true,
            'data' => MaterialResource::collection($materials),
        ]);
    }

    /**
     * Get kit component breakdown
     */
    public function kitBreakdown(Material $material): JsonResponse
    {
        $this->authorize('view', $material);

        if (! $material->is_kit) {
            return response()->json([
                'success' => false,
                'message' => 'Material is not a kit',
            ], 422);
        }

        $breakdown = $this->materialService->getKitBreakdown($material);

        return response()->json([
            'success' => true,
            'data' => $breakdown,
        ]);
    }

    /**
     * Get all categories
     */
    public function categories(): JsonResponse
    {
        $this->authorize('viewAny', Material::class);

        $categories = $this->materialService->getCategories();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Calculate sale price based on markup
     */
    public function calculatePrice(Material $material): JsonResponse
    {
        $this->authorize('update', $material);

        $this->materialService->calculateSalePrice($material);

        return response()->json([
            'success' => true,
            'message' => 'Sale price calculated successfully',
            'data' => new MaterialResource($material->fresh()),
        ]);
    }

    /**
     * Add component to kit
     */
    public function addComponent(Request $request, Material $material): JsonResponse
    {
        $this->authorize('update', $material);

        if (! $material->is_kit) {
            return response()->json([
                'success' => false,
                'message' => 'Material is not a kit',
            ], 422);
        }

        $validated = $request->validate([
            'component_material_id' => 'required|exists:materials,id|different:id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $component = $this->materialService->addKitComponent(
                $material,
                $validated['component_material_id'],
                $validated['quantity'],
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Component added to kit successfully',
                'data' => $component,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update component quantity in kit
     */
    public function updateComponent(Request $request, Material $material, int $componentId): JsonResponse
    {
        $this->authorize('update', $material);

        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $component = $this->materialService->updateKitComponent(
                $material,
                $componentId,
                $validated['quantity'],
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Component updated successfully',
                'data' => $component,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove component from kit
     */
    public function deleteComponent(Material $material, int $componentId): JsonResponse
    {
        $this->authorize('update', $material);

        try {
            $this->materialService->removeKitComponent($material, $componentId);

            return response()->json([
                'success' => true,
                'message' => 'Component removed from kit successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get material dependencies
     */
    public function getDependencies(Material $material): JsonResponse
    {
        $this->authorize('view', $material);

        $dependencies = $material->dependencies()->with('dependencyMaterial')->get();

        return response()->json([
            'success' => true,
            'data' => $dependencies,
        ]);
    }

    /**
     * Calculate dependencies for a quantity
     */
    public function calculateDependencies(Request $request, Material $material): JsonResponse
    {
        $this->authorize('view', $material);

        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
        ]);

        $dependencies = $material->calculateDependencies($validated['quantity']);

        return response()->json([
            'success' => true,
            'data' => $dependencies,
        ]);
    }

    /**
     * Add dependency to material
     */
    public function addDependency(Request $request, Material $material): JsonResponse
    {
        $this->authorize('update', $material);

        $validated = $request->validate([
            'dependency_material_id' => 'required|exists:materials,id|different:id',
            'dependency_type' => 'required|in:container,accessory,cable,consumable,tool',
            'quantity_type' => 'required|in:fixed,ratio,formula',
            'quantity_value' => 'required|string',
            'is_visible_in_quote' => 'nullable|boolean',
            'is_required_for_stock' => 'nullable|boolean',
            'is_optional' => 'nullable|boolean',
            'min_quantity_trigger' => 'nullable|numeric|min:0',
            'max_quantity_trigger' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $dependency = $this->materialService->addDependency($material, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Dependency added successfully',
                'data' => $dependency,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update dependency
     */
    public function updateDependency(Request $request, Material $material, int $dependencyId): JsonResponse
    {
        $this->authorize('update', $material);

        $validated = $request->validate([
            'dependency_type' => 'nullable|in:container,accessory,cable,consumable,tool',
            'quantity_type' => 'nullable|in:fixed,ratio,formula',
            'quantity_value' => 'nullable|string',
            'is_visible_in_quote' => 'nullable|boolean',
            'is_required_for_stock' => 'nullable|boolean',
            'is_optional' => 'nullable|boolean',
            'min_quantity_trigger' => 'nullable|numeric|min:0',
            'max_quantity_trigger' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $dependency = $this->materialService->updateDependency($material, $dependencyId, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Dependency updated successfully',
                'data' => $dependency,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete dependency
     */
    public function deleteDependency(Material $material, int $dependencyId): JsonResponse
    {
        $this->authorize('update', $material);

        try {
            $this->materialService->removeDependency($material, $dependencyId);

            return response()->json([
                'success' => true,
                'message' => 'Dependency removed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
