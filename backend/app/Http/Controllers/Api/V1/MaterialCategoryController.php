<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MaterialCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = MaterialCategory::ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:material_categories,name',
            'code' => 'required|string|max:255|unique:material_categories,code',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $category = MaterialCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Categoria creata con successo',
            'data' => $category,
        ], 201);
    }

    public function show(MaterialCategory $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    public function update(Request $request, MaterialCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:material_categories,name,' . $category->id,
            'code' => 'sometimes|required|string|max:255|unique:material_categories,code,' . $category->id,
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Categoria aggiornata con successo',
            'data' => $category,
        ]);
    }

    public function destroy(MaterialCategory $category): JsonResponse
    {
        // Check if there are materials using this category
        $materialsCount = $category->materials()->count();

        if ($materialsCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Impossibile eliminare la categoria. È utilizzata da {$materialsCount} materiali.",
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoria eliminata con successo',
        ]);
    }
}
