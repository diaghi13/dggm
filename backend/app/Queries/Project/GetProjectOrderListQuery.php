<?php

namespace App\Queries\Project;

use App\Domains\Product\Enums\ProductType;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectMaterial;
use App\Domains\Warehouse\Models\Inventory;
use App\Models\KitAssembly;
use App\Services\OrderListCalculatorService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GetProjectOrderListQuery
{
    public function __construct(
        private readonly Project $project,
        private readonly OrderListCalculatorService $calculator,
    ) {}

    /**
     * Build the order list classified into three groups:
     *   - available:    fully covered by existing stock
     *   - to_purchase:  shortage with no subrental suppliers
     *   - to_subrental: shortage but subrental suppliers exist
     *
     * Kit and composite materials are exploded into their leaf components
     * before stock comparison so the order list reflects real article needs.
     *
     * @return array{available: array, to_purchase: array, to_subrental: array}
     */
    public function execute(): array
    {
        $materials = ProjectMaterial::where('project_id', $this->project->id)
            ->whereNull('deleted_at')
            ->with([
                'product.subrentalSuppliers',
                'product.relations.relatedProduct',
            ])
            ->get();

        // Collect all subrental_supplier_entry IDs from JSON assignments
        $allEntryIds = $materials->flatMap(function ($m) {
            return collect($m->subrental_assignments ?? [])->pluck('subrental_supplier_entry_id');
        })->filter()->unique()->values()->all();

        // Build entry_id → {supplier_id, name, day_rate} map
        $entryInfoMap = [];
        if (! empty($allEntryIds)) {
            \App\Domains\Product\Models\ProductSubrentalSupplier::whereIn('id', $allEntryIds)
                ->with('supplier')
                ->get()
                ->each(function ($entry) use (&$entryInfoMap) {
                    $entryInfoMap[$entry->id] = [
                        'supplier_id' => $entry->supplier_id,
                        'name' => $entry->supplier?->company_name ?? "Fornitore #{$entry->supplier_id}",
                        'day_rate' => $entry->day_rate !== null ? (float) $entry->day_rate : null,
                    ];
                });
        }

        // Index subrental_assignments by project_material_id
        $assignmentsPerMaterial = $materials->mapWithKeys(fn ($m) => [$m->id => $m->subrental_assignments ?? []]);

        $leafEntries = $this->explodeMaterials($materials);

        $result = ['available' => [], 'to_purchase' => [], 'to_subrental' => []];

        foreach ($leafEntries as $entry) {
            $product = $entry['product'];
            $plannedQty = $entry['planned_quantity'];
            $projectMaterialId = $entry['project_material_id'];
            $productId = $entry['product_id'];

            $inventoryFree = $productId
                ? (float) Inventory::where('product_id', $productId)
                    ->sum(DB::raw('GREATEST(0, quantity_available - quantity_reserved)'))
                : 0.0;

            $toOrder = $this->calculator->calculateToOrder($plannedQty, $inventoryFree, 0);

            $hasSuppliers = $product?->subrentalSuppliers?->isNotEmpty() ?? false;
            $isRental = (bool) ($entry['is_rental'] ?? false);
            $category = $this->calculator->classifyItem($hasSuppliers, $toOrder, $isRental);

            $unitCost = (float) ($product?->standard_cost ?? 0);

            // Resolve assignments for this material
            $rawAssignments = $assignmentsPerMaterial->get($projectMaterialId) ?? [];
            $resolvedAssignments = array_map(function ($a) use ($entryInfoMap) {
                $entryId = $a['subrental_supplier_entry_id'];
                $info = $entryInfoMap[$entryId] ?? null;

                return [
                    'subrental_supplier_entry_id' => $entryId,
                    'supplier_id' => $info['supplier_id'] ?? null,
                    'supplier_name' => $info['name'] ?? "Entry #{$entryId}",
                    'day_rate' => $info['day_rate'] ?? null,
                    'quantity' => $a['quantity'] ?? null,
                    'quoted_price' => isset($a['quoted_price']) ? (float) $a['quoted_price'] : null,
                ];
            }, $rawAssignments);

            // estimated_cost: prefer sum of quoted_prices if any set, then day_rate×qty, else unit_cost×qty
            $assignmentCollection = collect($resolvedAssignments);
            $priceSet = $assignmentCollection->filter(fn ($a) => $a['quoted_price'] !== null);
            if ($priceSet->isNotEmpty()) {
                $estimatedCost = $priceSet->sum('quoted_price');
            } elseif ($assignmentCollection->isNotEmpty()) {
                // Use the stored assignment quantity if set, otherwise fall back to to_order_qty
                $estimatedCost = $assignmentCollection->sum(fn ($a) => ($a['day_rate'] ?? 0) * ($a['quantity'] ?? $toOrder));
            } else {
                $estimatedCost = $this->calculator->estimatePurchaseCost($toOrder, $unitCost);
            }

            $result[$category][] = [
                'project_material_id' => $projectMaterialId,
                'subrental_assignments' => $resolvedAssignments,
                'product_id' => $productId,
                'product_name' => $product?->name ?? $entry['notes'],
                'product_code' => $product?->code,
                'is_catalog_item' => $productId !== null,
                'planned_qty' => $plannedQty,
                'available_qty' => $inventoryFree,
                'reserved_qty' => 0.0,
                'to_order_qty' => $toOrder,
                'unit' => $product?->unit ?? 'pz',
                'unit_cost' => $unitCost,
                'estimated_cost' => $estimatedCost,
                'parent_product_id' => $entry['parent_product_id'],
                'parent_product_name' => $entry['parent_product_name'],
                'subrental_suppliers' => $hasSuppliers
                    ? $product->subrentalSuppliers->map(fn ($s) => [
                        'id' => $s->id,
                        'supplier_id' => $s->supplier_id,
                        'name' => $s->supplier?->company_name ?? (string) $s->supplier_id,
                        'day_rate' => $s->day_rate !== null ? (float) $s->day_rate : null,
                        'is_preferred' => (bool) $s->is_preferred,
                    ])->all()
                    : [],
            ];
        }

        return $result;
    }

    /**
     * Expand project materials into leaf entries, exploding kit and composite
     * products into their individual article components.
     * Articles and services pass through unchanged.
     *
     * @return Collection<int, array>
     */
    private function explodeMaterials(Collection $materials): Collection
    {
        $entries = collect();

        foreach ($materials as $material) {
            $product = $material->product;
            $plannedQty = (float) $material->planned_quantity;

            if (! $product) {
                // No catalog link — pass through as-is
                $entries->push([
                    'project_material_id' => $material->id,
                    'product_id' => null,
                    'product' => null,
                    'planned_quantity' => $plannedQty,
                    'notes' => $material->notes,
                    'parent_product_id' => null,
                    'parent_product_name' => null,
                    'is_rental' => $material->is_rental,
                ]);

                continue;
            }

            // Skip services and packages — they should never appear in the order list.
            if ($product->product_type === ProductType::SERVICE || $product->is_package) {
                continue;
            }

            match ($product->product_type) {
                ProductType::COMPOSITE => $this->explodeComposite($entries, $material, $product, $plannedQty),
                ProductType::KIT => $this->explodeKit($entries, $material, $product, $plannedQty),
                default => $entries->push([
                    'project_material_id' => $material->id,
                    'product_id' => $product->id,
                    'product' => $product,
                    'planned_quantity' => $plannedQty,
                    'notes' => $material->notes,
                    'parent_product_id' => null,
                    'parent_product_name' => null,
                    'is_rental' => $material->is_rental,
                ]),
            };
        }

        return $entries;
    }

    /**
     * Explode a composite product into its component articles using ALL relations
     * (not only relation_type=component) multiplied by the parent planned quantity.
     */
    private function explodeComposite(
        Collection $entries,
        ProjectMaterial $material,
        \App\Domains\Product\Models\Product $parent,
        float $parentQty
    ): void {
        $relations = $parent->relations()->with('relatedProduct.subrentalSuppliers')->get();

        if ($relations->isEmpty()) {
            // Composite has no defined relations — treat as article to avoid silent drops
            $entries->push([
                'project_material_id' => $material->id,
                'product_id' => $parent->id,
                'product' => $parent,
                'planned_quantity' => $parentQty,
                'notes' => $material->notes,
                'parent_product_id' => null,
                'parent_product_name' => null,
                'is_rental' => $material->is_rental,
            ]);

            return;
        }

        foreach ($relations as $relation) {
            $component = $relation->relatedProduct;

            if (! $component) {
                continue;
            }

            // Skip service components and packages within composites.
            if ($component->product_type === ProductType::SERVICE || $component->is_package) {
                continue;
            }

            $componentQty = $relation->calculateQuantity(1) * $parentQty;

            if ($componentQty <= 0) {
                continue;
            }

            $entries->push([
                'project_material_id' => $material->id,
                'product_id' => $component->id,
                'product' => $component,
                'planned_quantity' => $componentQty,
                'notes' => $material->notes,
                'parent_product_id' => $parent->id,
                'parent_product_name' => $parent->name,
                'is_rental' => $material->is_rental,
            ]);
        }
    }

    /**
     * Explode a kit product into its items using the most recent KitAssembly,
     * multiplied by the parent planned quantity.
     */
    private function explodeKit(
        Collection $entries,
        ProjectMaterial $material,
        \App\Domains\Product\Models\Product $parent,
        float $parentQty
    ): void {
        $assembly = KitAssembly::where('product_id', $parent->id)
            ->latest()
            ->with(['items.product.subrentalSuppliers'])
            ->first();

        if (! $assembly || $assembly->items->isEmpty()) {
            // No assembly defined — treat kit as a single article
            $entries->push([
                'project_material_id' => $material->id,
                'product_id' => $parent->id,
                'product' => $parent,
                'planned_quantity' => $parentQty,
                'notes' => $material->notes,
                'parent_product_id' => null,
                'parent_product_name' => null,
                'is_rental' => $material->is_rental,
            ]);

            return;
        }

        foreach ($assembly->items as $item) {
            $component = $item->product;

            if (! $component) {
                continue;
            }

            // Skip service components and packages within kit assemblies.
            if ($component->product_type === ProductType::SERVICE || $component->is_package) {
                continue;
            }

            $componentQty = (float) $item->quantity * $parentQty;

            $entries->push([
                'project_material_id' => $material->id,
                'product_id' => $component->id,
                'product' => $component,
                'planned_quantity' => $componentQty,
                'notes' => $material->notes,
                'parent_product_id' => $parent->id,
                'parent_product_name' => $parent->name,
                'is_rental' => $material->is_rental,
            ]);
        }
    }
}
