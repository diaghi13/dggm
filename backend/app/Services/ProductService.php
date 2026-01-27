<?php

namespace App\Services;

use App\Data\ProductData;
use App\Enums\ProductType;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function __construct(
        private EmbeddingService $embeddingService
    ) {}

    /**
     * Get all products with optional filters and pagination
     */
    public function getAll(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        // Se c'è una ricerca semantica, usa vector search
        if (isset($filters['semantic_search']) && $filters['semantic_search'] !== '') {
            return $this->semanticSearch($filters, $perPage);
        }

        $query = Product::query()->with(['defaultSupplier']);

        // Filter by active status
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by category
        if (isset($filters['category']) && $filters['category'] !== '') {
            $query->where('category', $filters['category']);
        }

        // Filter by product type (article, service, composite)
        if (isset($filters['product_type']) && $filters['product_type'] !== '') {
            $productType = ProductType::tryFrom($filters['product_type']);
            if ($productType) {
                $query->byProductType($productType);
            }
        }

        // Filter rentable items only
        if (isset($filters['rentable']) && filter_var($filters['rentable'], FILTER_VALIDATE_BOOLEAN)) {
            $query->rentable();
        }

        // Filter composite products only
        if (isset($filters['composites']) && filter_var($filters['composites'], FILTER_VALIDATE_BOOLEAN)) {
            $query->composites();
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
     * Ricerca semantica basata su descrizione/caratteristiche
     */
    private function semanticSearch(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Product::query()->with(['defaultSupplier']);

        // Applica comunque i filtri standard
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['category']) && $filters['category'] !== '') {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['product_type']) && $filters['product_type'] !== '') {
            $productType = ProductType::tryFrom($filters['product_type']);
            if ($productType) {
                $query->byProductType($productType);
            }
        }

        if (isset($filters['rentable']) && filter_var($filters['rentable'], FILTER_VALIDATE_BOOLEAN)) {
            $query->rentable();
        }

        if (isset($filters['composites']) && filter_var($filters['composites'], FILTER_VALIDATE_BOOLEAN)) {
            $query->composites();
        }

        // Recupera i materiali filtrati
        $products = $query->get();

        if ($products->isEmpty()) {
            return new LengthAwarePaginator([], 0, $perPage);
        }

        try {
            // Calcola similarità semantica
            $searchQuery = $filters['semantic_search'];
            $texts = $products->map(function ($product) {
                // Combina i campi rilevanti per la ricerca semantica
                return implode(' ', array_filter([
                    $product->name,
                    $product->description,
                    $product->category,
                    $product->code,
                ]));
            })->toArray();

            $similarities = $this->embeddingService->search($searchQuery, $texts);

            // Combina materiali con score di similarità
            $results = $products->map(function ($product, $index) use ($similarities) {
                $product->similarity_score = $similarities[$index];

                return $product;
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
            \Log::error('Vector search failed: '.$e->getMessage());

            $query = Product::query()->with(['defaultSupplier']);
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
     * Get a single product with all relationships (returns DTO)
     */
    public function getById(int $id): ProductData
    {
        $product = Product::with([
            'defaultSupplier',
            'inventory.warehouse',
            'components.componentProduct',
            'usedInComposites.kitProduct',
        ])->findOrFail($id);

        return ProductData::from($product);
    }

    /**
     * Create a new product (accepts array or DTO, returns DTO)
     */
    public function create(array|ProductData $data): ProductData
    {
        // Convert to fillable array (exclude computed properties)
        $dataArray = $data instanceof ProductData ? $this->toFillableArray($data) : $data;

        return DB::transaction(function () use ($dataArray) {
            // Extract components if present (for composite products)
            $components = $dataArray['components'] ?? [];
            unset($dataArray['components']);

            // Create product
            $product = Product::query()->create($dataArray);

            // If it's a composite and has components, attach them
            if ($product->product_type === ProductType::COMPOSITE && ! empty($components)) {
                foreach ($components as $component) {
                    $product->components()->create([
                        'component_product_id' => $component['component_product_id'],
                        'quantity' => $component['quantity'],
                        'notes' => $component['notes'] ?? null,
                    ]);
                }
            }

            return ProductData::from($product->fresh());
        });
    }

    /**
     * Convert ProductData to fillable array (exclude computed properties)
     */
    private function toFillableArray(ProductData $data): array
    {
        $array = $data->toArray();

        // Remove computed properties that don't exist in DB
        unset(
            $array['calculated_sale_price'],
            $array['composite_total_cost'],
            $array['total_stock'],
            $array['available_stock']
        );

        return $array;
    }

    /**
     * Update an existing product (accepts array or DTO, returns DTO)
     */
    public function update(Product $product, array|ProductData $data): ProductData
    {
        // Convert to fillable array (exclude computed properties)
        $dataArray = $data instanceof ProductData ? $this->toFillableArray($data) : $data;

        return DB::transaction(function () use ($product, $dataArray) {
            // Extract components if present
            $components = $dataArray['components'] ?? null;
            unset($dataArray['components']);

            // Update product
            $product->update($dataArray);

            // Update components if provided and product is composite
            if ($product->product_type === ProductType::COMPOSITE && $components !== null) {
                // Delete existing components
                $product->components()->delete();

                // Create new components
                foreach ($components as $component) {
                    $product->components()->create([
                        'component_product_id' => $component['component_product_id'],
                        'quantity' => $component['quantity'],
                        'notes' => $component['notes'] ?? null,
                    ]);
                }
            }

            return ProductData::from($product->fresh());
        });
    }

    /**
     * Delete a material (soft delete)
     */
    public function delete(Product $product): bool
    {
        // Check if material is used in any kits
        if ($product->usedInComposites()->exists()) {
            throw new \Exception('Cannot delete material that is used in kits. Remove from kits first.');
        }

        // Check if material has active inventory
        if ($product->total_stock > 0) {
            throw new \Exception('Cannot delete material with active inventory. Adjust stock to zero first.');
        }

        return $product->delete();
    }

    /**
     * Calculate sale price based on purchase price and markup
     */
    public function calculateSalePrice(Product $product): void
    {
        $product->calculateSalePrice();
        $product->save();
    }

    /**
     * Get materials that need reordering
     */
    public function getProductsNeedingReorder(): Collection
    {
        return Product::query()
            ->active()
            ->whereHas('inventory', function ($query) {
                $query->whereRaw('quantity_available <= minimum_stock');
            })
            ->with(['defaultSupplier', 'inventory'])
            ->get();
    }

    /**
     * Get composite component breakdown with costs
     */
    public function getCompositeBreakdown(Product $product): array
    {
        if ($product->product_type !== ProductType::COMPOSITE) {
            throw new \Exception('Product is not a composite');
        }

        $components = $product->components()->with('componentProduct')->get();

        return $components->map(function ($component) {
            return [
                'component_id' => $component->componentProduct->id,
                'component_code' => $component->componentProduct->code,
                'component_name' => $component->componentProduct->name,
                'quantity' => $component->quantity,
                'unit' => $component->componentProduct->unit,
                'unit_cost' => $component->componentProduct->purchase_price,
                'total_cost' => $component->quantity * $component->componentProduct->purchase_price,
            ];
        })->toArray();
    }

    /**
     * Check material availability for rental
     */
    public function checkRentalAvailability(Product $product, float $quantity): bool
    {
        if (! $product->is_rentable) {
            return false;
        }

        return $product->available_stock >= $quantity;
    }

    /**
     * Rent out material
     */
    public function rentOut(Product $product, float $quantity): bool
    {
        if (! $this->checkRentalAvailability($product, $quantity)) {
            throw new \Exception('Insufficient stock for rental.');
        }

        return $product->rentOut($quantity);
    }

    /**
     * Return rented material
     */
    public function rentReturn(Product $product, float $quantity): bool
    {
        return $product->rentReturn($quantity);
    }

    /**
     * Get all active categories
     */
    public function getCategories(): array
    {
        return Product::query()
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
    public function getRentalPricing(Product $product, string $period = 'daily'): float
    {
        return match ($period) {
            'daily' => $product->rental_price_daily,
            'weekly' => $product->rental_price_weekly,
            'monthly' => $product->rental_price_monthly,
            default => $product->rental_price_daily,
        };
    }

    /**
     * Calculate total cost for composite based on current component prices
     */
    public function calculateCompositeCost(Product $product): float
    {
        if ($product->product_type !== ProductType::COMPOSITE) {
            return 0;
        }

        return $product->composite_total_cost;
    }

    /**
     * Add component to composite (alias for Controller)
     */
    public function addComponent(Product $composite, int $componentProductId, float $quantity, ?string $notes = null)
    {
        return $this->addCompositeComponent($composite, $componentProductId, $quantity, $notes);
    }

    /**
     * Add component to composite product
     */
    public function addCompositeComponent(Product $composite, int $componentProductId, float $quantity, ?string $notes = null)
    {
        if ($composite->product_type !== ProductType::COMPOSITE) {
            throw new \Exception('Product is not a composite');
        }

        // Check that component exists
        $componentProduct = Product::findOrFail($componentProductId);

        // Prevent adding kit to itself
        if ($composite->id === $componentProductId) {
            throw new \Exception('Cannot add composite to itself');
        }

        // Check if component already exists
        $existing = $composite->components()->where('component_product_id', $componentProductId)->first();
        if ($existing) {
            throw new \Exception('Component already exists in this composite. Use update instead.');
        }

        return $composite->components()->create([
            'component_product_id' => $componentProductId,
            'quantity' => $quantity,
            'notes' => $notes,
        ]);
    }

    /**
     * Update kit component
     */
    public function updateCompositeComponent(Product $composite, int $componentId, float $quantity, ?string $notes = null)
    {
        $component = $composite->components()->findOrFail($componentId);

        $component->update([
            'quantity' => $quantity,
            'notes' => $notes,
        ]);

        return $component->fresh('componentProduct');
    }

    /**
     * Remove component from kit
     */
    public function removeCompositeComponent(Product $composite, int $componentId): bool
    {
        $component = $composite->components()->findOrFail($componentId);

        return $component->delete();
    }

    /**
     * Add dependency to material
     */
    public function addDependency(Product $product, array $data)
    {
        // Prevent adding material as dependency of itself
        if ($product->id === $data['dependency_product_id']) {
            throw new \Exception('Cannot add material as dependency of itself');
        }

        // Check if dependency already exists
        $existing = $product->dependencies()
            ->where('dependency_product_id', $data['dependency_product_id'])
            ->first();

        if ($existing) {
            throw new \Exception('Dependency already exists. Use update instead.');
        }

        return $product->dependencies()->create($data);
    }

    /**
     * Update dependency
     */
    public function updateDependency(Product $product, int $dependencyId, array $data)
    {
        $dependency = $product->dependencies()->findOrFail($dependencyId);

        $dependency->update($data);

        return $dependency->fresh('dependencyProduct');
    }

    /**
     * Remove dependency
     */
    public function removeDependency(Product $product, int $dependencyId): bool
    {
        $dependency = $product->dependencies()->findOrFail($dependencyId);

        return $dependency->delete();
    }

    /**
     * Get all dependencies for a product
     */
    public function getDependencies(Product $product)
    {
        return $product->dependencies()
            ->with('dependencyProduct')
            ->get();
    }

    /**
     * Calculate dependencies for a given quantity
     */
    public function calculateDependencies(Product $product, float $quantity): array
    {
        $dependencies = $this->getDependencies($product);

        return $dependencies->map(function ($dependency) use ($quantity) {
            $calculatedQuantity = match ($dependency->quantity_type) {
                'fixed' => (float) $dependency->quantity_value,
                'per_unit' => (float) $dependency->quantity_value * $quantity,
                'percentage' => $quantity * ((float) $dependency->quantity_value / 100),
                default => 0,
            };

            return [
                'id' => $dependency->id,
                'dependency_product_id' => $dependency->dependency_product_id,
                'dependency_product' => $dependency->dependencyProduct,
                'dependency_type' => $dependency->dependency_type,
                'quantity_type' => $dependency->quantity_type,
                'quantity_value' => $dependency->quantity_value,
                'calculated_quantity' => $calculatedQuantity,
                'is_visible_in_quote' => $dependency->is_visible_in_quote,
                'is_required_for_stock' => $dependency->is_required_for_stock,
                'is_optional' => $dependency->is_optional,
            ];
        })->toArray();
    }

    /**
     * Delete dependency (alias for removeDependency)
     */
    public function deleteDependency(Product $product, int $dependencyId): bool
    {
        return $this->removeDependency($product, $dependencyId);
    }

    /**
     * Update component (alias for updateCompositeComponent)
     */
    public function updateComponent(Product $composite, int $componentId, float $quantity, ?string $notes = null)
    {
        return $this->updateCompositeComponent($composite, $componentId, $quantity, $notes);
    }

    /**
     * Delete component (alias for removeCompositeComponent)
     */
    public function deleteComponent(Product $composite, int $componentId): bool
    {
        return $this->removeCompositeComponent($composite, $componentId);
    }

    /**
     * Calculate composite price (alias for calculateCompositeCost)
     */
    public function calculateCompositePrice(Product $product): float
    {
        return $this->calculateCompositeCost($product);
    }
}
