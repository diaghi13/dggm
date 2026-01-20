<?php

namespace App\Services;

use App\Enums\MaterialType;
use App\Models\Material;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MaterialService
{
    public function __construct(
        private EmbeddingService $embeddingService
    ) {}

    /**
     * Get all materials with optional filters and pagination
     */
//    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
//    {
//        $query = Material::query()->with(['defaultSupplier']);
//
//        // Filter by active status
//        if (isset($filters['is_active'])) {
//            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
//        }
//
//        // Filter by category
//        if (isset($filters['category']) && $filters['category'] !== '') {
//            $query->where('category', $filters['category']);
//        }
//
//        // Filter by product type
//        if (isset($filters['product_type']) && $filters['product_type'] !== '') {
//            $productType = MaterialType::tryFrom($filters['product_type']);
//            if ($productType) {
//                $query->byProductType($productType);
//            }
//        }
//
//        // Filter rentable items only
//        if (isset($filters['rentable']) && filter_var($filters['rentable'], FILTER_VALIDATE_BOOLEAN)) {
//            $query->rentable();
//        }
//
//        // Filter kits only
//        if (isset($filters['kits']) && filter_var($filters['kits'], FILTER_VALIDATE_BOOLEAN)) {
//            $query->kits();
//        }
//
//        // Filter by low stock
//        if (isset($filters['low_stock']) && filter_var($filters['low_stock'], FILTER_VALIDATE_BOOLEAN)) {
//            $query->lowStock();
//        }
//
//        // Search by code, name, or barcode
//        if (isset($filters['search']) && $filters['search'] !== '') {
//            $search = $filters['search'];
//            $query->where(function ($q) use ($search) {
//                $q->where('code', 'like', "%{$search}%")
//                    ->orWhere('name', 'like', "%{$search}%")
//                    ->orWhere('barcode', 'like', "%{$search}%");
//            });
//        }
//
//        // Sorting
//        $sortField = $filters['sort_field'] ?? 'code';
//        $sortDirection = $filters['sort_direction'] ?? 'asc';
//        $query->orderBy($sortField, $sortDirection);
//
//        return $query->paginate($perPage);
//    }
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        // Se c'è una ricerca semantica, usa vector search
        if (isset($filters['semantic_search']) && $filters['semantic_search'] !== '') {
            return $this->semanticSearch($filters, $perPage);
        }

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

        // Search by code, name, or barcode (ricerca classica)
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
     * Ricerca semantica basata su descrizione/caratteristiche
     */
    private function semanticSearch(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Material::query()->with(['defaultSupplier']);

        // Applica comunque i filtri standard
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['category']) && $filters['category'] !== '') {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['product_type']) && $filters['product_type'] !== '') {
            $productType = MaterialType::tryFrom($filters['product_type']);
            if ($productType) {
                $query->byProductType($productType);
            }
        }

        if (isset($filters['rentable']) && filter_var($filters['rentable'], FILTER_VALIDATE_BOOLEAN)) {
            $query->rentable();
        }

        if (isset($filters['kits']) && filter_var($filters['kits'], FILTER_VALIDATE_BOOLEAN)) {
            $query->kits();
        }

        // Recupera i materiali filtrati
        $materials = $query->get();

        if ($materials->isEmpty()) {
            return new LengthAwarePaginator([], 0, $perPage);
        }

        try {
            // Calcola similarità semantica
            $searchQuery = $filters['semantic_search'];
            $texts = $materials->map(function ($material) {
                // Combina i campi rilevanti per la ricerca semantica
                return implode(' ', array_filter([
                    $material->name,
                    $material->description,
                    $material->category,
                    $material->code
                ]));
            })->toArray();

            $similarities = $this->embeddingService->search($searchQuery, $texts);

            // Combina materiali con score di similarità
            $results = $materials->map(function ($material, $index) use ($similarities) {
                $material->similarity_score = $similarities[$index];
                return $material;
            })
                ->sortByDesc('similarity_score')
                ->values();

            // Paginazione manuale
            $page = request()->get('page', 1);
            $offset = ($page - 1) * $perPage;
            $items = $results->slice($offset, $perPage)->values();

            return new LengthAwarePaginator(
                $items,
                $results->count(),
                $perPage,
                $page,
                ['path' => request()->url(), 'query' => request()->query()]
            );

        } catch (\Exception $e) {
            // Fallback a ricerca normale in caso di errore
            \Log::error('Vector search failed: ' . $e->getMessage());

            $query = Material::query()->with(['defaultSupplier']);
            $search = $filters['semantic_search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });

            return $query->paginate($perPage);
        }
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
