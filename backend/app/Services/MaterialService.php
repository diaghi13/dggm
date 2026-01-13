<?php

namespace App\Services;

use App\Enums\MaterialType;
use App\Models\Material;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MaterialService
{
    /**
     * Get all materials with optional filters and pagination
     */
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Material::query()->with(['defaultSupplier']);

        // Filter by active status
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by category
        if (isset($filters['category']) && $filters['category'] !== '') {
            $query->where('category', $filters['category']);
        }

        // Filter by product type
        if (isset($filters['product_type']) && $filters['product_type'] !== '') {
            $productType = MaterialType::tryFrom($filters['product_type']);
            if ($productType) {
                $query->byProductType($productType);
            }
        }

        // Filter rentable items only
        if (isset($filters['rentable']) && filter_var($filters['rentable'], FILTER_VALIDATE_BOOLEAN)) {
            $query->rentable();
        }

        // Filter kits only
        if (isset($filters['kits']) && filter_var($filters['kits'], FILTER_VALIDATE_BOOLEAN)) {
            $query->kits();
        }

        // Filter by low stock
        if (isset($filters['low_stock']) && filter_var($filters['low_stock'], FILTER_VALIDATE_BOOLEAN)) {
            $query->lowStock();
        }

        // Search by code, name, or barcode
        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortField = $filters['sort_field'] ?? 'code';
        $sortDirection = $filters['sort_direction'] ?? 'asc';
        $query->orderBy($sortField, $sortDirection);

        return $query->paginate($perPage);
    }

    /**
     * Get a single material with all relationships
     */
    public function getById(int $id): Material
    {
        return Material::with([
            'defaultSupplier',
            'inventory.warehouse',
            'components.componentMaterial',
            'usedInKits.kitMaterial',
        ])->findOrFail($id);
    }

    /**
     * Create a new material
     */
    public function create(array $data): Material
    {
        return DB::transaction(function () use ($data) {
            // Extract components if present (for kits)
            $components = $data['components'] ?? [];
            unset($data['components']);

            // Create material
            $material = Material::create($data);

            // If it's a kit and has components, attach them
            if ($material->is_kit && ! empty($components)) {
                foreach ($components as $component) {
                    $material->components()->create([
                        'component_material_id' => $component['component_material_id'],
                        'quantity' => $component['quantity'],
                    ]);
                }
            }

            return $material->fresh(['components.componentMaterial']);
        });
    }

    /**
     * Update an existing material
     */
    public function update(Material $material, array $data): Material
    {
        return DB::transaction(function () use ($material, $data) {
            // Extract components if present
            $components = $data['components'] ?? null;
            unset($data['components']);

            // Update material
            $material->update($data);

            // Update components if provided and material is a kit
            if ($material->is_kit && $components !== null) {
                // Delete existing components
                $material->components()->delete();

                // Create new components
                foreach ($components as $component) {
                    $material->components()->create([
                        'component_material_id' => $component['component_material_id'],
                        'quantity' => $component['quantity'],
                    ]);
                }
            }

            return $material->fresh(['components.componentMaterial']);
        });
    }

    /**
     * Delete a material (soft delete)
     */
    public function delete(Material $material): bool
    {
        // Check if material is used in any kits
        if ($material->usedInKits()->exists()) {
            throw new \Exception('Cannot delete material that is used in kits. Remove from kits first.');
        }

        // Check if material has active inventory
        if ($material->total_stock > 0) {
            throw new \Exception('Cannot delete material with active inventory. Adjust stock to zero first.');
        }

        return $material->delete();
    }

    /**
     * Calculate sale price based on purchase price and markup
     */
    public function calculateSalePrice(Material $material): void
    {
        $material->calculateSalePrice();
        $material->save();
    }

    /**
     * Get materials that need reordering
     */
    public function getMaterialsNeedingReorder(): Collection
    {
        return Material::query()
            ->active()
            ->whereHas('inventory', function ($query) {
                $query->whereRaw('quantity_available <= minimum_stock');
            })
            ->with(['defaultSupplier', 'inventory'])
            ->get();
    }

    /**
     * Get kit component breakdown with costs
     */
    public function getKitBreakdown(Material $material): array
    {
        if (! $material->is_kit) {
            return [];
        }

        $components = $material->components()->with('componentMaterial')->get();

        return $components->map(function ($component) {
            return [
                'component_id' => $component->componentMaterial->id,
                'component_code' => $component->componentMaterial->code,
                'component_name' => $component->componentMaterial->name,
                'quantity' => $component->quantity,
                'unit' => $component->componentMaterial->unit,
                'unit_cost' => $component->componentMaterial->purchase_price,
                'total_cost' => $component->quantity * $component->componentMaterial->purchase_price,
            ];
        })->toArray();
    }

    /**
     * Check material availability for rental
     */
    public function checkRentalAvailability(Material $material, float $quantity): bool
    {
        if (! $material->is_rentable) {
            return false;
        }

        return $material->available_stock >= $quantity;
    }

    /**
     * Rent out material
     */
    public function rentOut(Material $material, float $quantity): bool
    {
        if (! $this->checkRentalAvailability($material, $quantity)) {
            throw new \Exception('Insufficient stock for rental.');
        }

        return $material->rentOut($quantity);
    }

    /**
     * Return rented material
     */
    public function rentReturn(Material $material, float $quantity): bool
    {
        return $material->rentReturn($quantity);
    }

    /**
     * Get all active categories
     */
    public function getCategories(): array
    {
        return Material::query()
            ->active()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();
    }

    /**
     * Get rental pricing for a material
     */
    public function getRentalPricing(Material $material, string $period = 'daily'): float
    {
        return match ($period) {
            'daily' => $material->rental_price_daily,
            'weekly' => $material->rental_price_weekly,
            'monthly' => $material->rental_price_monthly,
            default => $material->rental_price_daily,
        };
    }

    /**
     * Calculate total cost for kit based on current component prices
     */
    public function calculateKitCost(Material $material): float
    {
        if (! $material->is_kit) {
            return 0;
        }

        return $material->kit_total_cost;
    }

    /**
     * Add component to kit
     */
    public function addKitComponent(Material $kit, int $componentMaterialId, float $quantity, ?string $notes = null)
    {
        if (! $kit->is_kit) {
            throw new \Exception('Material is not a kit');
        }

        // Check that component exists
        $componentMaterial = Material::findOrFail($componentMaterialId);

        // Prevent adding kit to itself
        if ($kit->id === $componentMaterialId) {
            throw new \Exception('Cannot add kit to itself');
        }

        // Check if component already exists
        $existing = $kit->components()->where('component_material_id', $componentMaterialId)->first();
        if ($existing) {
            throw new \Exception('Component already exists in this kit. Use update instead.');
        }

        return $kit->components()->create([
            'component_material_id' => $componentMaterialId,
            'quantity' => $quantity,
            'notes' => $notes,
        ]);
    }

    /**
     * Update kit component
     */
    public function updateKitComponent(Material $kit, int $componentId, float $quantity, ?string $notes = null)
    {
        $component = $kit->components()->findOrFail($componentId);

        $component->update([
            'quantity' => $quantity,
            'notes' => $notes,
        ]);

        return $component->fresh('componentMaterial');
    }

    /**
     * Remove component from kit
     */
    public function removeKitComponent(Material $kit, int $componentId): bool
    {
        $component = $kit->components()->findOrFail($componentId);

        return $component->delete();
    }

    /**
     * Add dependency to material
     */
    public function addDependency(Material $material, array $data)
    {
        // Prevent adding material as dependency of itself
        if ($material->id === $data['dependency_material_id']) {
            throw new \Exception('Cannot add material as dependency of itself');
        }

        // Check if dependency already exists
        $existing = $material->dependencies()
            ->where('dependency_material_id', $data['dependency_material_id'])
            ->first();

        if ($existing) {
            throw new \Exception('Dependency already exists. Use update instead.');
        }

        return $material->dependencies()->create($data);
    }

    /**
     * Update dependency
     */
    public function updateDependency(Material $material, int $dependencyId, array $data)
    {
        $dependency = $material->dependencies()->findOrFail($dependencyId);

        $dependency->update($data);

        return $dependency->fresh('dependencyMaterial');
    }

    /**
     * Remove dependency
     */
    public function removeDependency(Material $material, int $dependencyId): bool
    {
        $dependency = $material->dependencies()->findOrFail($dependencyId);

        return $dependency->delete();
    }
}
