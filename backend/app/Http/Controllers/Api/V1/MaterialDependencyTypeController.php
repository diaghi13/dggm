<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MaterialDependencyType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialDependencyTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $types = MaterialDependencyType::ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $types,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:material_dependency_types,name',
            'code' => 'required|string|max:255|unique:material_dependency_types,code',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $type = MaterialDependencyType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tipo dipendenza creato con successo',
            'data' => $type,
        ], 201);
    }

    public function show(MaterialDependencyType $type): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $type,
        ]);
    }

    public function update(Request $request, MaterialDependencyType $type): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:material_dependency_types,name,'.$type->id,
            'code' => 'sometimes|required|string|max:255|unique:material_dependency_types,code,'.$type->id,
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $type->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tipo dipendenza aggiornato con successo',
            'data' => $type,
        ]);
    }

    public function destroy(MaterialDependencyType $type): JsonResponse
    {
        // Check if there are dependencies using this type
        $dependenciesCount = $type->dependencies()->count();

        if ($dependenciesCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Impossibile eliminare il tipo. È utilizzato da {$dependenciesCount} dipendenze.",
            ], 422);
        }

        $type->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tipo dipendenza eliminato con successo',
        ]);
    }
}
