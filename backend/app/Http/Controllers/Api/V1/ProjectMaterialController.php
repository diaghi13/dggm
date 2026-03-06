<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ProjectMaterialData;
use App\Enums\ProjectMaterialStatus;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectMaterialController extends Controller
{
    /**
     * Get all materials for a project
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $query = ProjectMaterial::with(['product.category', 'quoteItem'])
            ->where('project_id', $project->id);

        if ($request->has('product_type')) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('product_type', $request->product_type);
            });
        }

        $materials = $query->get();

        return response()->json([
            'success' => true,
            'data' => ProjectMaterialData::collect($materials),
            // 'data' => $materials->toArray(),
        ]);
    }

    /**
     * Store a new project material
     */
    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quote_item_id' => 'nullable|exists:quote_items,id',
            'is_extra' => 'boolean',
            'extra_reason' => 'nullable|string|max:500',
            'planned_quantity' => 'required|numeric|min:0.01',
            'planned_unit_cost' => 'required|numeric|min:0',
            'required_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $isExtra = $validated['is_extra'] ?? (empty($validated['quote_item_id']));

        $projectMaterial = ProjectMaterial::create([
            ...$validated,
            'project_id' => $project->id,
            'is_extra' => $isExtra,
            'requested_by' => $isExtra ? $request->user()->id : null,
            'requested_at' => $isExtra ? now() : null,
            'allocated_quantity' => 0,
            'delivered_quantity' => 0,
            'used_quantity' => 0,
            'returned_quantity' => 0,
            'actual_unit_cost' => $validated['planned_unit_cost'],
            'status' => 'planned',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Material added to project successfully',
            'data' => ProjectMaterialData::from($projectMaterial->load('product')),
        ], 201);
    }

    /**
     * Update project material
     */
    public function update(Request $request, Project $project, ProjectMaterial $projectMaterial): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this project',
            ], 404);
        }

        $validated = $request->validate([
            'planned_quantity' => 'sometimes|numeric|min:0',
            'planned_unit_cost' => 'sometimes|numeric|min:0',
            'actual_unit_cost' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:planned,reserved,delivered,in_use,completed,returned',
            'required_date' => 'nullable|date',
            'delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $projectMaterial->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Material updated successfully',
            'data' => ProjectMaterialData::from($projectMaterial->fresh(['product'])),
        ]);
    }

    /**
     * Delete project material
     */
    public function destroy(Project $project, ProjectMaterial $projectMaterial): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this project',
            ], 404);
        }

        $projectMaterial->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material removed from project successfully',
        ]);
    }

    /**
     * Log material usage
     */
    public function logUsage(Request $request, Project $project, ProjectMaterial $projectMaterial): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this project',
            ], 404);
        }

        $validated = $request->validate([
            'quantity_used' => [
                'required',
                'numeric',
                'min:0.01',
                function ($attribute, $value, $fail) use ($projectMaterial) {
                    if (($projectMaterial->used_quantity + $value) > $projectMaterial->planned_quantity) {
                        $fail('The quantity used cannot exceed the planned quantity.');
                    }
                },
            ],
            'actual_unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $projectMaterial->used_quantity += $validated['quantity_used'];

        if (isset($validated['actual_unit_cost'])) {
            $projectMaterial->actual_unit_cost = $validated['actual_unit_cost'];
        }

        if (isset($validated['notes'])) {
            $projectMaterial->notes = $validated['notes'];
        }

        if ($projectMaterial->used_quantity >= $projectMaterial->planned_quantity) {
            $projectMaterial->status = 'completed';
        } elseif ($projectMaterial->used_quantity > 0 && $projectMaterial->status->value !== 'in_use' && $projectMaterial->status->value !== 'completed') {
            $projectMaterial->status = 'in_use';
        }

        $projectMaterial->save();

        return response()->json([
            'success' => true,
            'message' => 'Usage logged successfully',
            'data' => ProjectMaterialData::from($projectMaterial->fresh(['product'])),
        ]);
    }

    /**
     * Reserve material from warehouse
     */
    public function reserve(Request $request, Project $project, ProjectMaterial $projectMaterial): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this project',
            ], 404);
        }

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
        ]);

        $projectMaterial->allocated_quantity += $validated['quantity'];
        $projectMaterial->status = 'reserved';
        $projectMaterial->save();

        return response()->json([
            'success' => true,
            'message' => 'Material reserved successfully',
            'data' => ProjectMaterialData::from($projectMaterial->fresh(['product'])),
        ]);
    }

    /**
     * Deliver material to project
     */
    public function deliver(Request $request, Project $project, ProjectMaterial $projectMaterial): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this project',
            ], 404);
        }

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $projectMaterial->delivered_quantity += $validated['quantity'];
        $projectMaterial->delivery_date = $validated['delivery_date'] ?? now();

        $netQuantity = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;
        $planned = $projectMaterial->planned_quantity;

        if ($netQuantity == 0) {
            $projectMaterial->status = ProjectMaterialStatus::PLANNED;
        } else {
            $projectMaterial->status = ProjectMaterialStatus::DELIVERED;
        }

        $projectMaterial->save();

        return response()->json([
            'success' => true,
            'message' => 'Material delivered to project successfully',
            'data' => ProjectMaterialData::from($projectMaterial->fresh(['product'])),
        ]);
    }

    /**
     * Return material from project to warehouse
     */
    public function returnMaterial(Request $request, Project $project, ProjectMaterial $projectMaterial): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this project',
            ], 404);
        }

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        $maxReturn = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;
        if ($validated['quantity'] > $maxReturn) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot return more than delivered quantity',
                'errors' => [
                    'quantity' => [
                        "Maximum returnable quantity is {$maxReturn}",
                    ],
                ],
            ], 422);
        }

        $projectMaterial->returned_quantity += $validated['quantity'];
        $projectMaterial->used_quantity = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;

        $netQuantity = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;

        if ($netQuantity == 0) {
            $projectMaterial->status = ProjectMaterialStatus::RETURNED;
        } else {
            $projectMaterial->status = ProjectMaterialStatus::DELIVERED;
        }

        $projectMaterial->save();

        return response()->json([
            'success' => true,
            'message' => 'Material returned to warehouse successfully',
            'data' => ProjectMaterialData::from($projectMaterial->fresh(['product'])),
        ]);
    }

    /**
     * Transfer material between projects
     */
    public function transferToProject(Request $request, Project $fromProject, ProjectMaterial $projectMaterial): JsonResponse
    {
        $this->authorize('update', $fromProject);

        if ($projectMaterial->project_id !== $fromProject->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this project',
            ], 404);
        }

        $validated = $request->validate([
            'to_project_id' => 'required|exists:projects,id',
            'quantity' => 'required|numeric|min:0.01',
            'ddt_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $toProject = Project::findOrFail($validated['to_project_id']);
        $this->authorize('update', $toProject);

        $available = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;
        if ($validated['quantity'] > $available) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot transfer more than available quantity',
                'errors' => [
                    'quantity' => [
                        "Maximum transferable quantity is {$available}",
                    ],
                ],
            ], 422);
        }

        $transferredMaterial = ProjectMaterial::create([
            'project_id' => $toProject->id,
            'product_id' => $projectMaterial->product_id,
            'quote_item_id' => null,
            'is_extra' => true,
            'extra_reason' => "Trasferimento da progetto {$fromProject->name}",
            'requested_by' => $request->user()->id,
            'requested_at' => now(),
            'planned_quantity' => $validated['quantity'],
            'delivered_quantity' => $validated['quantity'],
            'used_quantity' => 0,
            'returned_quantity' => 0,
            'planned_unit_cost' => $projectMaterial->actual_unit_cost,
            'actual_unit_cost' => $projectMaterial->actual_unit_cost,
            'status' => 'delivered',
            'delivery_date' => now(),
            'notes' => "Trasferito da {$fromProject->name}. DDT: {$validated['ddt_number']}. {$validated['notes']}",
        ]);

        $projectMaterial->returned_quantity += $validated['quantity'];
        $projectMaterial->used_quantity = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;

        $netQuantity = $projectMaterial->delivered_quantity - $projectMaterial->returned_quantity;
        $planned = $projectMaterial->planned_quantity;

        if ($netQuantity == 0) {
            $projectMaterial->status = 'planned';
        } elseif ($netQuantity < $planned) {
            $projectMaterial->status = 'partial';
        } else {
            $projectMaterial->status = 'delivered';
        }

        $projectMaterial->notes = ($projectMaterial->notes ?? '')."\n[TRASFERITO] {$validated['quantity']} a {$toProject->name} - DDT: {$validated['ddt_number']}";
        $projectMaterial->save();

        return response()->json([
            'success' => true,
            'message' => "Material transferred to project '{$toProject->name}' successfully",
            'data' => [
                'from' => ProjectMaterialData::from($projectMaterial->fresh(['product'])),
                'to' => ProjectMaterialData::from($transferredMaterial->load('product')),
            ],
        ]);
    }

    /**
     * Get only extra materials (not from quote)
     */
    public function extras(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $extras = ProjectMaterial::where('project_id', $project->id)
            ->extras()
            ->with(['product', 'requestedBy'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProjectMaterialData::collect($extras),
            'summary' => [
                'total_extras' => $extras->count(),
                'total_extra_cost' => $extras->sum(fn ($m) => $m->used_quantity * $m->actual_unit_cost),
            ],
        ]);
    }
}
