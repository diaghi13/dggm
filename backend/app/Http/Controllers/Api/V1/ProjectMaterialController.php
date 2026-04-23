<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ProjectMaterialData;
use App\Enums\KitAssemblyStatus;
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
            'subrental_assignments' => 'nullable|array',
            'subrental_assignments.*.subrental_supplier_entry_id' => 'required|integer|exists:product_subrental_suppliers,id',
            'subrental_assignments.*.quantity' => 'nullable|numeric|min:0.01',
            'subrental_assignments.*.quoted_price' => 'nullable|numeric|min:0',
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

        if ($netQuantity == 0) {
            $projectMaterial->status = ProjectMaterialStatus::PLANNED;
        } else {
            $projectMaterial->status = ProjectMaterialStatus::DELIVERED;
        }

        $projectMaterial->save();

        // Sync kit assembly status to InUse
        if ($projectMaterial->kit_assembly_id && $projectMaterial->kitAssembly) {
            $assembly = $projectMaterial->kitAssembly;
            if (in_array($assembly->status, [KitAssemblyStatus::Assembled, KitAssemblyStatus::Returned])) {
                $assembly->update(['status' => KitAssemblyStatus::InUse]);
            }
        }

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

        // Sync kit assembly status to Returned
        if ($projectMaterial->kit_assembly_id && $projectMaterial->kitAssembly) {
            $assembly = $projectMaterial->kitAssembly;
            if ($assembly->status === KitAssemblyStatus::InUse) {
                $assembly->update(['status' => KitAssemblyStatus::Returned]);
            }
        }

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
     * Add a subrental supplier assignment to a project material.
     * POST /projects/{project}/materials/{projectMaterial}/subrental-assignments
     */
    public function addSubrentalAssignment(Request $request, Project $project, ProjectMaterial $projectMaterial): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json(['success' => false, 'message' => 'Material does not belong to this project'], 404);
        }

        $validated = $request->validate([
            'subrental_supplier_entry_id' => 'required|integer|exists:product_subrental_suppliers,id',
            'quantity' => 'nullable|numeric|min:0.01',
            'quoted_price' => 'nullable|numeric|min:0',
        ]);

        $current = $projectMaterial->subrental_assignments ?? [];

        // Avoid duplicates — update if already exists, otherwise append
        $found = false;
        $current = array_map(function ($a) use ($validated, &$found) {
            if ($a['subrental_supplier_entry_id'] === $validated['subrental_supplier_entry_id']) {
                $found = true;

                return array_merge($a, array_filter($validated, fn ($v) => $v !== null));
            }

            return $a;
        }, $current);

        if (! $found) {
            $current[] = [
                'subrental_supplier_entry_id' => $validated['subrental_supplier_entry_id'],
                'quantity' => $validated['quantity'] ?? null,
                'quoted_price' => $validated['quoted_price'] ?? null,
            ];
        }

        $projectMaterial->update(['subrental_assignments' => $current]);

        return response()->json([
            'success' => true,
            'data' => $projectMaterial->fresh()->subrental_assignments,
        ]);
    }

    /**
     * Update price/quantity for a specific subrental assignment.
     * PATCH /projects/{project}/materials/{projectMaterial}/subrental-assignments/{entryId}
     */
    public function updateSubrentalAssignment(Request $request, Project $project, ProjectMaterial $projectMaterial, int $entryId): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json(['success' => false, 'message' => 'Material does not belong to this project'], 404);
        }

        $validated = $request->validate([
            'quantity' => 'nullable|numeric|min:0.01',
            'quoted_price' => 'nullable|numeric|min:0',
        ]);

        $current = $projectMaterial->subrental_assignments ?? [];
        $updated = array_map(function ($a) use ($entryId, $validated) {
            if ($a['subrental_supplier_entry_id'] === $entryId) {
                return array_merge($a, [
                    'quantity' => array_key_exists('quantity', $validated) ? $validated['quantity'] : ($a['quantity'] ?? null),
                    'quoted_price' => array_key_exists('quoted_price', $validated) ? $validated['quoted_price'] : ($a['quoted_price'] ?? null),
                ]);
            }

            return $a;
        }, $current);

        $projectMaterial->update(['subrental_assignments' => $updated]);

        return response()->json([
            'success' => true,
            'data' => $projectMaterial->fresh()->subrental_assignments,
        ]);
    }

    /**
     * Remove a specific subrental assignment.
     * DELETE /projects/{project}/materials/{projectMaterial}/subrental-assignments/{entryId}
     */
    public function removeSubrentalAssignment(Project $project, ProjectMaterial $projectMaterial, int $entryId): JsonResponse
    {
        $this->authorize('update', $project);

        if ($projectMaterial->project_id !== $project->id) {
            return response()->json(['success' => false, 'message' => 'Material does not belong to this project'], 404);
        }

        $current = $projectMaterial->subrental_assignments ?? [];
        $updated = array_values(array_filter($current, fn ($a) => $a['subrental_supplier_entry_id'] !== $entryId));

        $projectMaterial->update(['subrental_assignments' => $updated]);

        return response()->json(['success' => true]);
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
