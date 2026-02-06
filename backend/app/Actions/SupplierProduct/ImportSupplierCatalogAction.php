<?php

namespace App\Actions\SupplierProduct;

use App\Actions\Product\CreateProductAction;
use App\Actions\Product\UpdateProductAction;
use App\Data\ProductData;
use App\Data\SupplierProductData;
use App\Models\Product;
use App\Services\ImportFieldTransformer;
use Illuminate\Support\Facades\DB;

class ImportSupplierCatalogAction
{
    public function __construct(
        private readonly UpsertSupplierProductAction $upsertAction,
        private readonly CreateProductAction $createProductAction,
        private readonly UpdateProductAction $updateProductAction
    ) {}

    /**
     * Import a supplier catalog row (creates/updates product + supplier_product)
     *
     * @return array{product_id: int, product_code: string, supplier_id: int, action: string}
     */
    public function execute(array $row): array
    {
        return DB::transaction(function () use ($row) {
            // 1. Transform virtual fields (brand, category, supplier, etc.)
            $transformed = ImportFieldTransformer::transform('supplier_catalog', $row);

            // 2. Separate product data vs supplier_product data
            $productData = $this->extractProductData($transformed);
            $supplierProductData = $this->extractSupplierProductData($transformed);

            // 3. Find or create product (returns array with product and was_created flag)
            $result = $this->findOrCreateProduct($productData);
            $product = $result['product'];
            $wasCreated = $result['was_created'];

            // 4. Add product_id to supplier_product data
            $supplierProductData['product_id'] = $product->id;

            // 5. Upsert supplier_product using Action
            $supplierProductDto = SupplierProductData::from($supplierProductData);
            $supplierProduct = $this->upsertAction->execute($supplierProductDto);

            return [
                'product_id' => $product->id,
                'product_code' => $product->code,
                'supplier_id' => $supplierProduct->supplier_id,
                'action' => $wasCreated ? 'created' : 'updated',
            ];
        });
    }

    /**
     * Extract product table fields from transformed row
     */
    private function extractProductData(array $row): array
    {
        $productFields = [
            'code', 'name', 'description', 'unit', 'brand_id', 'category_id',
            'product_type', 'barcode', 'ean', 'etim_code', 'internal_code', 'notes',
            'is_package', 'package_weight', 'package_volume', 'package_dimensions',
            'is_rentable', 'standard_cost',
            // NEW: Manufacturer reference prices
            'manufacturer_cost_price', 'manufacturer_retail_price', 'sale_markup_percent',
        ];

        $result = [];
        foreach ($row as $key => $value) {
            if (in_array($key, $productFields)) {
                $result[$key] = $value;
            }
        }

        // Map manufacturer price aliases if present
        if (! isset($result['manufacturer_cost_price'])) {
            $result['manufacturer_cost_price'] = $row['manufacturer_cost'] ?? $row['cost_price'] ?? null;
        }
        if (! isset($result['manufacturer_retail_price'])) {
            $result['manufacturer_retail_price'] = $row['manufacturer_retail'] ?? $row['msrp'] ?? $row['rrp'] ?? null;
        }

        // Map unit using ProductUnitType if needed
        if (isset($result['unit'])) {
            $result['unit'] = $this->mapUnit($result['unit']);
        }

        return $result;
    }

    /**
     * Extract supplier_product table fields from transformed row
     */
    private function extractSupplierProductData(array $row): array
    {
        $supplierProductFields = [
            'supplier_id', 'supplier_product_code', 'supplier_ean',
            'purchase_price', 'wholesale_price', 'retail_price',
            'discount_family_id', 'manual_discount_1', 'manual_discount_2', 'manual_discount_3',
            'package_quantity', 'minimum_order_quantity', 'maximum_order_quantity',
            'multiple_order_quantity', 'lead_time_days', 'payment_term_id',
            'price_multiplier', 'currency', 'last_price_update',
            'is_preferred_supplier', 'is_active', 'notes',
        ];

        $result = [];
        foreach ($row as $key => $value) {
            if (in_array($key, $supplierProductFields)) {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Find or create product with minimum viable data using Actions
     *
     * @return array{product: Product, was_created: bool}
     */
    private function findOrCreateProduct(array $data): array
    {
        if (empty($data['code'])) {
            throw new \InvalidArgumentException('Product code is required');
        }

        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Product name is required');
        }

        $product = Product::where('code', $data['code'])->first();

        if (! $product) {
            // Create with defaults using ProductData
            $productData = ProductData::from(array_merge([
                'code' => $data['code'],
                'name' => $data['name'],
                'unit' => 'pz',
                'product_type' => 'article',
                'is_active' => true,
                'standard_cost' => null,
                'reorder_level' => null,
                'reorder_quantity' => null,
                'lead_time_days' => null,
                'is_rentable' => false,
                'quantity_out_on_rental' => 0,
                'is_package' => false,
            ], $data));

            $createdProduct = $this->createProductAction->execute($productData);

            return ['product' => $createdProduct, 'was_created' => true];
        }

        // Update if additional data provided (more than just code + name)
        if (count($data) > 2) {
            $productData = ProductData::from(array_merge([
                'code' => $product->code,
                'name' => $product->name,
                'product_type' => $product->product_type,
            ], $data));

            $updatedProduct = $this->updateProductAction->execute($product, $productData);

            return ['product' => $updatedProduct, 'was_created' => false];
        }

        return ['product' => $product, 'was_created' => false];
    }

    /**
     * Map supplier unit to standard unit code using ProductUnitType
     */
    private function mapUnit(string $supplierUnit): string
    {
        $unit = \App\Models\ProductUnitType::findByAlias($supplierUnit);

        return $unit ? $unit->code : 'pz'; // Default to 'pz' if not found
    }
}
