<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Product\CreateProductAction;
use App\Actions\Product\DeleteProductAction;
use App\Actions\Product\UpdateProductAction;
use App\Data\ProductData;
use App\Http\Controllers\Controller;
use App\Http\Requests\ImportProductPostRequest;
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
            'price_list_id',
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
    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        // Load relationships for complete data
        $product->load([
            'category',
            'brand',
            'defaultSupplier',
            'relations',
            'media',
        ]);

        // Load price list item if price_list_id is provided
        if ($request->has('price_list_id')) {
            $product->load(['priceListItems' => function ($q) use ($request) {
                $q->where('price_list_id', $request->input('price_list_id'))
                    ->where('is_active', true);
            }]);
        }

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

        $data = ProductData::from($request->all());
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
    public function import(ImportProductPostRequest $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $validated = $request->validated();

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

                // Create Product using ProductData and CreateProductAction
                $data = ProductData::from([
                    // Required fields
                    'code' => $transformed['code'],
                    'name' => $transformed['name'],
                    'product_type' => $transformed['type'] ?? 'article',
                    'unit' => $transformed['unit'] ?? 'pz',

                    // Basic info
                    'description' => $transformed['description'] ?? null,
                    'internal_code' => $transformed['internal_code'] ?? null,
                    'notes' => $transformed['notes'] ?? null,

                    // Codes & Identifiers
                    'ean' => $transformed['ean'] ?? null,
                    'etim_code' => $transformed['etim_code'] ?? null,
                    'barcode' => $transformed['barcode'] ?? null,
                    'qr_code' => $transformed['qr_code'] ?? null,

                    // Relations (already transformed to IDs by ImportFieldTransformer)
                    'category_id' => $transformed['category_id'] ?? null,
                    'brand_id' => $transformed['brand_id'] ?? null,
                    'default_supplier_id' => $transformed['default_supplier_id'] ?? null,

                    // Pricing (manufacturer reference prices)
                    'standard_cost' => $transformed['standard_cost'] ?? null,
                    'manufacturer_cost_price' => $transformed['manufacturer_cost_price'] ?? null,
                    'manufacturer_retail_price' => $transformed['manufacturer_retail_price'] ?? null,
                    'sale_markup_percent' => $transformed['sale_markup_percent'] ?? null,

                    // Package
                    'is_package' => $transformed['is_package'] ?? false,
                    'package_weight' => $transformed['package_weight'] ?? null,
                    'package_volume' => $transformed['package_volume'] ?? null,
                    'package_dimensions' => $transformed['package_dimensions'] ?? null,

                    // Rental
                    'is_rentable' => $transformed['is_rentable'] ?? false,
                    'quantity_out_on_rental' => 0,

                    // Inventory
                    'reorder_level' => $transformed['reorder_level'] ?? null,
                    'reorder_quantity' => $transformed['reorder_quantity'] ?? null,
                    'lead_time_days' => $transformed['lead_time_days'] ?? null,
                    'location' => $transformed['location'] ?? null,

                    // Status
                    'is_active' => $transformed['is_active'] ?? true,
                ]);

                $this->createAction->execute($data);

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
