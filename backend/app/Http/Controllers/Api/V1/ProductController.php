<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Product\CreateProductAction;
use App\Actions\Product\DeleteProductAction;
use App\Actions\Product\UpdateProductAction;
use App\Data\ProductData;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Queries\Product\GetProductsQuery;
use App\Services\ImportFieldTransformer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\PaginatedDataCollection;

class ProductController extends Controller
{
    public function __construct(
        private readonly CreateProductAction $createAction,
        private readonly UpdateProductAction $updateAction,
        private readonly DeleteProductAction $deleteAction
    ) {}

    /**
     * Display a listing of products
     * Uses Query Class for complex filtering - follows AI_ARCHITECTURE_RULES.md
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $filters = $request->only([
            'is_active',
            'category',
            'category_id',
            'product_type',
            'rentable',
            'composites',
            'low_stock',
            'search',
            'barcode',
            'semantic_search',
            'sort_field',
            'sort_direction',
        ]);

        $perPage = min($request->input('per_page', 20), 100);

        $products = GetProductsQuery::execute($filters, $perPage);

        // Convert paginated items to DTOs while preserving pagination meta
        return response()->json([
            'success' => true,
            ...ProductData::collect($products, PaginatedDataCollection::class)->toArray(),
        ]);
    }

    /**
     * Store a newly created product
     * Uses Action pattern - follows AI_ARCHITECTURE_RULES.md
     */
    public function store(ProductData $data): JsonResponse
    {
        $this->authorize('create', Product::class);

        $product = $this->createAction->execute($data);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => ProductData::from($product),
        ], 201);
    }

    /**
     * Display the specified product
     */
    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        // Load relationships for complete data
        $product->load([
            'category',
            'defaultSupplier',
            'relations',
        ]);

        return response()->json([
            'success' => true,
            'data' => ProductData::from($product),
        ]);
    }

    /**
     * Update the specified product
     * Uses Action pattern - follows AI_ARCHITECTURE_RULES.md
     */
    public function update(Product $product, Request $request): JsonResponse
    {
        $this->authorize('update', $product);

        $request['id'] = $product->id; // Ensure ID is set for validation

        $data = ProductData::from($request);

        $updated = $this->updateAction->execute($product, $data);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => ProductData::from($updated),
        ]);
    }

    /**
     * Remove the specified product
     * Uses Action pattern - follows AI_ARCHITECTURE_RULES.md
     */
    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $this->deleteAction->execute($product);

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }

    /**
     * Get products needing reorder
     * Simple query - can stay in controller per AI_ARCHITECTURE_RULES.md
     */
    public function needingReorder(): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::query()
            ->whereColumn('reorder_level', '>', 0)
            ->whereRaw('(SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE inventory.product_id = products.id) <= products.reorder_level')
            ->with(['category', 'defaultSupplier'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProductData::collect($products),
        ]);
    }

    /**
     * Calculate price for composite product
     * Uses Model methods - follows AI_ARCHITECTURE_RULES.md
     */
    public function calculatePrice(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $salePrice = $product->calculateCompositeSalePrice();
        $cost = $product->calculateCompositeCost();

        return response()->json([
            'success' => true,
            'data' => [
                'sale_price' => $salePrice,
                'cost' => $cost,
                'margin' => $salePrice - $cost,
                'margin_percentage' => $cost > 0 ? (($salePrice - $cost) / $cost) * 100 : 0,
            ],
        ]);
    }

    /**
     * Import products from Excel
     */
    public function import(Request $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $validated = $request->validate([
            'products' => 'required|array|min:1',
            'products.*.code' => 'required|string|max:255',
            'products.*.name' => 'required|string|max:255',
            'products.*.type' => 'nullable|string|in:article,service,composite',
            'products.*.unit' => 'required|string|max:50',
            'products.*.description' => 'nullable|string',
            'products.*.category' => 'nullable', // Can be ID (int) or string (code/name)
            'products.*.price' => 'nullable|numeric|min:0',
            'products.*.cost' => 'nullable|numeric|min:0',
            'products.*.supplier_code' => 'nullable|string|max:255',
            'products.*.brand' => 'nullable', // Can be ID (int) or string (code/name)
            'products.*.notes' => 'nullable|string',
            'products.*.is_active' => 'nullable|boolean',
            'products.*.min_stock' => 'nullable|integer|min:0',
            'products.*.max_stock' => 'nullable|integer|min:0',
        ]);

        $imported = 0;
        $skipped = 0;
        $errors = [];

        // Get all existing product codes in a single query (performance optimization)
        $existingCodes = Product::whereIn(
            'code',
            array_column($validated['products'], 'code')
        )->pluck('code')->toArray();

        foreach ($validated['products'] as $index => $productData) {
            try {
                // Check if product with same code already exists
                if (in_array($productData['code'], $existingCodes)) {
                    $skipped++;
                    $errors[] = 'Riga '.($index + 1).": Codice '{$productData['code']}' già esistente";

                    continue;
                }

                // Transform virtual fields (brand, category) to IDs
                $transformed = ImportFieldTransformer::transform('products', $productData);

                // Create Product with transformed data
                Product::create([
                    'code' => $transformed['code'],
                    'name' => $transformed['name'],
                    'product_type' => $transformed['type'] ?? 'article',
                    'unit' => $transformed['unit'],
                    'description' => $transformed['description'] ?? null,
                    'category_id' => $transformed['category_id'] ?? null,
                    'brand_id' => $transformed['brand_id'] ?? null,
                    'standard_cost' => $transformed['cost'] ?? 0,
                    'purchase_price' => $transformed['cost'] ?? 0,
                    'markup_percentage' => 0,
                    'sale_price' => $transformed['price'] ?? 0,
                    'rental_price_daily' => 0,
                    'rental_price_weekly' => 0,
                    'rental_price_monthly' => 0,
                    'barcode' => $transformed['barcode'] ?? null,
                    'qr_code' => null,
                    'default_supplier_id' => $transformed['default_supplier_id'] ?? null,
                    'reorder_level' => $transformed['min_stock'] ?? 0,
                    'reorder_quantity' => 0,
                    'lead_time_days' => 0,
                    'location' => null,
                    'notes' => $transformed['notes'] ?? null,
                    'is_rentable' => false,
                    'quantity_out_on_rental' => 0,
                    'is_active' => $transformed['is_active'] ?? true,
                    'is_package' => false,
                    'package_weight' => $transformed['weight'] ?? null,
                    'package_volume' => null,
                    'package_dimensions' => null,
                ]);

                $imported++;
            } catch (\Exception $e) {
                $skipped++;
                $errors[] = 'Riga '.($index + 1).': '.$e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Importazione completata: {$imported} prodotti importati, {$skipped} saltati",
            'data' => [
                'imported' => $imported,
                'skipped' => $skipped,
                'errors' => $errors,
            ],
        ]);
    }
}
