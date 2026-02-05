<?php

namespace App\Actions\SupplierProduct;

use App\Data\SupplierProductData;
use App\Models\Product;
use App\Services\ImportFieldTransformer;
use Illuminate\Support\Facades\DB;

class ImportSupplierCatalogAction
{
    public function __construct(
        private readonly UpsertSupplierProductAction $upsertAction
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

            // 3. Find or create product
            $product = $this->findOrCreateProduct($productData);

            // 4. Add product_id to supplier_product data
            $supplierProductData['product_id'] = $product->id;

            // 5. Upsert supplier_product using Action
            $supplierProductDto = SupplierProductData::from($supplierProductData);
            $supplierProduct = $this->upsertAction->execute($supplierProductDto);

            return [
                'product_id' => $product->id,
                'product_code' => $product->code,
                'supplier_id' => $supplierProduct->supplier_id,
                'action' => $product->wasRecentlyCreated ? 'created' : 'updated',
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
            'is_rentable', 'standard_cost', 'sale_price',
        ];

        $result = [];
        foreach ($row as $key => $value) {
            if (in_array($key, $productFields)) {
                $result[$key] = $value;
            }
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
     * Find or create product with minimum viable data
     */
    private function findOrCreateProduct(array $data): Product
    {
        if (empty($data['code'])) {
            throw new \InvalidArgumentException('Product code is required');
        }

        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Product name is required');
        }

        $product = Product::where('code', $data['code'])->first();

        if (! $product) {
            // Create with defaults
            $product = Product::create(array_merge([
                'unit' => 'pcs',
                'product_type' => 'article',
                'is_active' => true,
                'standard_cost' => 0,
                'purchase_price' => 0,
                'markup_percentage' => 0,
                'sale_price' => 0,
                'rental_price_daily' => 0,
                'rental_price_weekly' => 0,
                'rental_price_monthly' => 0,
                'reorder_level' => 0,
                'reorder_quantity' => 0,
                'lead_time_days' => 0,
                'is_rentable' => false,
                'quantity_out_on_rental' => 0,
                'is_package' => false,
            ], $data));
        } elseif (count($data) > 2) {
            // Update if additional data provided (more than just code + name)
            $product->update($data);
        }

        return $product;
    }
}
