<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SiteMaterialResource;
use App\Models\Material;
use App\Models\Site;
use App\Models\SiteMaterial;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteMaterialController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {}

    /**
     * Get all materials for a site
     */
    public function index(Request $request, Site $site): JsonResponse
    {
        $this->authorize('view', $site);

        $query = SiteMaterial::where('site_id', $site->id)
            ->with(['material', 'quoteItem']);

        // Filter by product_type if provided (physical, service, kit)
        if ($request->has('product_type')) {
            $query->whereHas('material', function ($q) use ($request) {
                $q->where('product_type', $request->product_type);
            });
        }

        $materials = $query->get();

        return response()->json([
            'success' => true,
            'data' => SiteMaterialResource::collection($materials),
        ]);
    }

    /**
     * Store a new site material
     */
    public function store(Request $request, Site $site): JsonResponse
    {
        $this->authorize('update', $site);

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'quote_item_id' => 'nullable|exists:quote_items,id',
            'is_extra' => 'boolean',
            'extra_reason' => 'nullable|string|max:500',
            'planned_quantity' => 'required|numeric|min:0.01',
            'planned_unit_cost' => 'required|numeric|min:0',
            'required_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        // If no quote_item_id is provided, mark as extra
        $isExtra = $validated['is_extra'] ?? (empty($validated['quote_item_id']));

        $siteMaterial = SiteMaterial::create([
            ...$validated,
            'site_id' => $site->id,
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
            'message' => 'Material added to site successfully',
            'data' => new SiteMaterialResource($siteMaterial->load('material')),
        ], 201);
    }

    /**
     * Update site material
     */
    public function update(Request $request, Site $site, SiteMaterial $material): JsonResponse
    {
        $this->authorize('update', $site);

        if ($material->site_id !== $site->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this site',
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

        $material->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Material updated successfully',
            'data' => new SiteMaterialResource($material->fresh(['material'])),
        ]);
    }

    /**
     * Log material usage (ADVANCED MODE - for future detailed tracking)
     *
     * This method allows granular usage tracking per material.
     * Currently not used in simplified workflow where delivery = usage.
     * Keep for future enhancement when detailed tracking is needed.
     */
    public function logUsage(Request $request, Site $site, SiteMaterial $material): JsonResponse
    {
        $this->authorize('update', $site);

        if ($material->site_id !== $site->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this site',
            ], 404);
        }

        $validated = $request->validate([
            'quantity_used' => 'required|numeric|min:0.01',
            'actual_unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if adding this quantity would exceed planned quantity
        $newTotal = $material->used_quantity + $validated['quantity_used'];
        if ($newTotal > $material->planned_quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Quantity used would exceed planned quantity',
                'errors' => [
                    'quantity_used' => [
                        'The quantity used cannot exceed the planned quantity. Maximum available: '.($material->planned_quantity - $material->used_quantity).' '.$material->material->unit,
                    ],
                ],
            ], 422);
        }

        $material->used_quantity = $newTotal;

        if (isset($validated['actual_unit_cost'])) {
            $material->actual_unit_cost = $validated['actual_unit_cost'];
        }

        if (isset($validated['notes'])) {
            $material->notes = $validated['notes'];
        }

        // Update status based on usage
        if ($material->used_quantity >= $material->planned_quantity) {
            $material->status = 'completed';
        } elseif ($material->used_quantity > 0 && $material->status->value !== 'in_use' && $material->status->value !== 'completed') {
            $material->status = 'in_use';
        }

        $material->save();

        return response()->json([
            'success' => true,
            'message' => 'Usage logged successfully',
            'data' => new SiteMaterialResource($material->fresh(['material'])),
        ]);
    }

    /**
     * Reserve material from warehouse
     */
    public function reserve(Request $request, Site $site, SiteMaterial $material): JsonResponse
    {
        $this->authorize('update', $site);

        if ($material->site_id !== $site->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this site',
            ], 404);
        }

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
        ]);

        // TODO: Integrate with InventoryService to reserve stock
        $material->allocated_quantity += $validated['quantity'];
        $material->status = 'reserved';
        $material->save();

        return response()->json([
            'success' => true,
            'message' => 'Material reserved successfully',
            'data' => new SiteMaterialResource($material->fresh(['material'])),
        ]);
    }

    /**
     * Deliver material to site (SIMPLIFIED WORKFLOW)
     *
     * In the simplified workflow:
     * - Material is discharged from warehouse immediately
     * - delivered_quantity = used_quantity (assumption: all delivered material is used)
     * - Status automatically set to COMPLETED
     * - Stock movement is recorded for tracking
     */
    public function deliver(Request $request, Site $site, SiteMaterial $material): JsonResponse
    {
        $this->authorize('update', $site);

        if ($material->site_id !== $site->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this site',
            ], 404);
        }

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            // Check if there's a DDT in transit for this material
            $pendingDdt = \App\Models\Ddt::where('site_id', $site->id)
                ->whereIn('status', ['issued', 'in_transit'])
                ->whereHas('items', function ($query) use ($material) {
                    $query->where('material_id', $material->material_id);
                })
                ->first();

            if ($pendingDdt) {
                return response()->json([
                    'success' => false,
                    'message' => "Esiste già un DDT ({$pendingDdt->code}) in transito per questo materiale. Conferma prima la ricezione del DDT.",
                    'data' => [
                        'ddt_code' => $pendingDdt->code,
                        'ddt_id' => $pendingDdt->id,
                        'ddt_status' => $pendingDdt->status,
                    ],
                ], 422);
            }

            // Discharge from warehouse (automatic stock decrement)
            $this->inventoryService->deliverToSite(
                materialId: $material->material_id,
                warehouseId: $validated['warehouse_id'],
                siteId: $site->id,
                quantity: $validated['quantity'],
                notes: $validated['notes'] ?? "Consegna a cantiere {$site->name}"
            );

            // Update site material quantities
            $material->delivered_quantity += $validated['quantity'];
            $material->delivery_date = $validated['delivery_date'] ?? now();

            // Recalculate status based on quantities (simplified workflow)
            $netQuantity = $material->delivered_quantity - $material->returned_quantity;
            $planned = $material->planned_quantity;

            if ($netQuantity == 0) {
                $material->status = 'planned';
            } elseif ($netQuantity < $planned) {
                $material->status = 'partial';
            } elseif ($netQuantity >= $planned) {
                $material->status = 'completed';
            }

            $material->save();

            return response()->json([
                'success' => true,
                'message' => 'Material delivered and discharged from warehouse successfully',
                'data' => new SiteMaterialResource($material->fresh(['material'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deliver material: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Return material from site to warehouse (for leftovers)
     *
     * When material is returned from site:
     * - Stock is added back to warehouse
     * - returned_quantity is updated
     * - used_quantity is adjusted (delivered - returned)
     * - Stock movement is recorded
     */
    public function returnMaterial(Request $request, Site $site, SiteMaterial $material): JsonResponse
    {
        $this->authorize('update', $site);

        if ($material->site_id !== $site->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this site',
            ], 404);
        }

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if return quantity is valid
        $maxReturn = $material->delivered_quantity - $material->returned_quantity;
        if ($validated['quantity'] > $maxReturn) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot return more than delivered quantity',
                'errors' => [
                    'quantity' => [
                        "Maximum returnable quantity is {$maxReturn} {$material->material->unit}",
                    ],
                ],
            ], 422);
        }

        try {
            // Return to warehouse (increase stock)
            $this->inventoryService->returnFromSite(
                materialId: $material->material_id,
                warehouseId: $validated['warehouse_id'],
                siteId: $site->id,
                quantity: $validated['quantity'],
                notes: $validated['notes'] ?? "Rientro da cantiere {$site->name}"
            );

            // Update site material
            $material->returned_quantity += $validated['quantity'];
            $material->used_quantity = $material->delivered_quantity - $material->returned_quantity;

            // Recalculate status based on quantities
            $netQuantity = $material->delivered_quantity - $material->returned_quantity;
            $planned = $material->planned_quantity;

            if ($netQuantity == 0) {
                $material->status = 'planned';
            } elseif ($netQuantity < $planned) {
                $material->status = 'partial';
            } elseif ($netQuantity >= $planned) {
                $material->status = 'completed';
            }

            $material->save();

            return response()->json([
                'success' => true,
                'message' => 'Material returned to warehouse successfully',
                'data' => new SiteMaterialResource($material->fresh(['material'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to return material: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Transfer material between sites (with DDT tracking)
     *
     * When transferring material site-to-site:
     * - Material is NOT returned to warehouse stock
     * - New SiteMaterial record is created for destination site
     * - Original site material quantity is reduced
     * - Stock movement tracks the transfer (no warehouse impact)
     */
    public function transferToSite(Request $request, Site $fromSite, SiteMaterial $material): JsonResponse
    {
        $this->authorize('update', $fromSite);

        if ($material->site_id !== $fromSite->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this site',
            ], 404);
        }

        $validated = $request->validate([
            'to_site_id' => 'required|exists:sites,id',
            'quantity' => 'required|numeric|min:0.01',
            'ddt_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $toSite = Site::findOrFail($validated['to_site_id']);
        $this->authorize('update', $toSite);

        // Check if transfer quantity is valid
        $available = $material->delivered_quantity - $material->returned_quantity;
        if ($validated['quantity'] > $available) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot transfer more than available quantity',
                'errors' => [
                    'quantity' => [
                        "Maximum transferable quantity is {$available} {$material->material->unit}",
                    ],
                ],
            ], 422);
        }

        try {
            // Create new site material for destination site
            $transferredMaterial = SiteMaterial::create([
                'site_id' => $toSite->id,
                'material_id' => $material->material_id,
                'quote_item_id' => null,
                'is_extra' => true,
                'extra_reason' => "Trasferimento da cantiere {$fromSite->name}",
                'requested_by' => $request->user()->id,
                'requested_at' => now(),
                'planned_quantity' => $validated['quantity'],
                'delivered_quantity' => $validated['quantity'],
                'used_quantity' => 0, // Nel workflow semplificato, delivered = used
                'returned_quantity' => 0,
                'planned_unit_cost' => $material->actual_unit_cost,
                'actual_unit_cost' => $material->actual_unit_cost,
                'status' => 'completed', // Materiale arrivato = completato
                'delivery_date' => now(),
                'notes' => "Trasferito da {$fromSite->name}. DDT: {$validated['ddt_number']}. {$validated['notes']}",
            ]);

            // Update original site material (reduce quantity - trattato come ritorno)
            $material->returned_quantity += $validated['quantity'];
            $material->used_quantity = $material->delivered_quantity - $material->returned_quantity;

            // Recalculate status based on quantities
            $netQuantity = $material->delivered_quantity - $material->returned_quantity;
            $planned = $material->planned_quantity;

            if ($netQuantity == 0) {
                $material->status = 'planned';
            } elseif ($netQuantity < $planned) {
                $material->status = 'partial';
            } elseif ($netQuantity >= $planned) {
                $material->status = 'completed';
            }

            $material->notes = ($material->notes ?? '')."\n[TRASFERITO] {$validated['quantity']} a {$toSite->name} - DDT: {$validated['ddt_number']}";
            $material->save();

            return response()->json([
                'success' => true,
                'message' => "Material transferred to site '{$toSite->name}' successfully",
                'data' => [
                    'from' => new SiteMaterialResource($material->fresh(['material'])),
                    'to' => new SiteMaterialResource($transferredMaterial->load('material')),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to transfer material: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get only extra materials (not from quote)
     */
    public function extras(Site $site): JsonResponse
    {
        $this->authorize('view', $site);

        $extras = SiteMaterial::where('site_id', $site->id)
            ->extras()
            ->with(['material', 'requestedBy'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => SiteMaterialResource::collection($extras),
            'summary' => [
                'total_extras' => $extras->count(),
                'total_extra_cost' => $extras->sum(fn ($m) => $m->used_quantity * $m->actual_unit_cost),
            ],
        ]);
    }

    /**
     * Delete site material
     */
    public function destroy(Site $site, SiteMaterial $material): JsonResponse
    {
        $this->authorize('update', $site);

        if ($material->site_id !== $site->id) {
            return response()->json([
                'success' => false,
                'message' => 'Material does not belong to this site',
            ], 404);
        }

        $material->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material removed from site successfully',
        ]);
    }
}
