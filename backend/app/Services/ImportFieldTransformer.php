<?php

namespace App\Services;

use App\Domains\Product\Models\ProductBrand;
use App\Domains\Product\Models\ProductCategory;
use App\Models\DiscountFamily;
use App\Models\PaymentTerm;
use App\Models\Supplier;

/**
 * Transform import fields from user-friendly codes to database FK IDs
 */
class ImportFieldTransformer
{
    /**
     * Transform a row of import data for a specific model
     *
     * @param  string  $model  Model name (table name)
     * @param  array  $row  Raw import data
     * @return array Transformed data ready for DB
     */
    public static function transform(string $model, array $row): array
    {
        $transformers = self::getTransformers();

        if (! isset($transformers[$model])) {
            return $row; // No transformers defined, return as-is
        }

        $transformed = $row;

        foreach ($transformers[$model] as $virtualField => $config) {
            if (! isset($row[$virtualField])) {
                continue; // Virtual field not present in row
            }

            $value = $row[$virtualField];
            $targetField = $config['target'];
            $transformer = $config['transformer'];

            // Apply transformation
            $transformed[$targetField] = $transformer($value, $row);

            // Remove virtual field from final data
            unset($transformed[$virtualField]);
        }

        return $transformed;
    }

    /**
     * Get available virtual fields for a model (for UI display)
     */
    public static function getVirtualFields(string $model): array
    {
        $transformers = self::getTransformers();

        if (! isset($transformers[$model])) {
            return [];
        }

        $virtualFields = [];

        foreach ($transformers[$model] as $virtualField => $config) {
            $virtualFields[] = [
                'key' => $virtualField,
                'label' => $config['label'],
                'description' => $config['description'],
                'example' => $config['example'] ?? null,
                'target' => $config['target'],
            ];
        }

        return $virtualFields;
    }

    /**
     * Define field transformers for each model
     */
    private static function getTransformers(): array
    {
        return [
            'products' => [
                // Generic brand (tries ID, then code, then name)
                'brand' => [
                    'label' => 'Marca',
                    'description' => 'Marca (ID, codice o nome). Sarà convertito in brand_id',
                    'example' => 'BTicino',
                    'target' => 'brand_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value)) {
                            return null;
                        }

                        // Try as ID first
                        if (is_numeric($value)) {
                            $brand = ProductBrand::find($value);
                            if ($brand) {
                                return $brand->id;
                            }
                        }

                        // Try as code
                        $brand = ProductBrand::where('code', strtoupper($value))->first();
                        if ($brand) {
                            return $brand->id;
                        }

                        // Try as name (case insensitive)
                        $brand = ProductBrand::whereRaw('LOWER(name) = ?', [strtolower($value)])->first();
                        if ($brand) {
                            return $brand->id;
                        }

                        // Auto-create brand if not exists
                        $brand = ProductBrand::create([
                            'name' => $value,
                            'is_active' => true,
                        ]);

                        return $brand->id;
                    },
                ],

                // Brand by code
                //                'brand_code' => [
                //                    'label' => 'Codice Marca',
                //                    'description' => 'Sigla marca (es. BTI). Sarà convertito in brand_id',
                //                    'example' => 'BTI',
                //                    'target' => 'brand_id',
                //                    'transformer' => function ($value, $row) {
                //                        if (empty($value)) {
                //                            return null;
                //                        }
                //
                //                        $brand = ProductBrand::where('code', strtoupper($value))->first();
                //
                //                        if (! $brand) {
                //                            // Auto-create brand if not exists
                //                            $brand = ProductBrand::create([
                //                                'name' => $value,
                //                                'is_active' => true,
                //                            ]);
                //                        }
                //
                //                        return $brand->id;
                //                    },
                //                ],

                // Brand by name
                //                'brand_name' => [
                //                    'label' => 'Nome Marca',
                //                    'description' => 'Nome completo marca (es. BTicino). Sarà convertito in brand_id',
                //                    'example' => 'BTicino',
                //                    'target' => 'brand_id',
                //                    'transformer' => function ($value, $row) {
                //                        if (empty($value)) {
                //                            return null;
                //                        }
                //
                //                        // Try to find by name (case insensitive)
                //                        $brand = ProductBrand::whereRaw('LOWER(name) = ?', [strtolower($value)])->first();
                //
                //                        if (! $brand) {
                //                            // Auto-create brand
                //                            $brand = ProductBrand::create([
                //                                'name' => $value,
                //                                'is_active' => true,
                //                            ]);
                //                        }
                //
                //                        return $brand->id;
                //                    },
                //                ],

                // Generic category (tries ID, then code, then name)
                'category' => [
                    'label' => 'Categoria',
                    'description' => 'Categoria (ID, codice o nome). Sarà convertito in category_id',
                    'example' => 'Elettrico',
                    'target' => 'category_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value)) {
                            return null;
                        }

                        // Try as ID first
                        if (is_numeric($value)) {
                            $category = ProductCategory::find($value);
                            if ($category) {
                                return $category->id;
                            }
                        }

                        // Try as code
                        $category = ProductCategory::where('code', strtoupper($value))->first();
                        if ($category) {
                            return $category->id;
                        }

                        // Try as name (case insensitive)
                        $category = ProductCategory::whereRaw('LOWER(name) = ?', [strtolower($value)])->first();
                        if ($category) {
                            return $category->id;
                        }

                        // Category not found, return null (don't auto-create categories)
                        return null;
                    },
                ],

                // Category by code
                //                'category_code' => [
                //                    'label' => 'Codice Categoria',
                //                    'description' => 'Codice categoria prodotto',
                //                    'example' => 'ELETT',
                //                    'target' => 'category_id',
                //                    'transformer' => function ($value, $row) {
                //                        if (empty($value)) {
                //                            return null;
                //                        }
                //
                //                        $category = ProductCategory::where('code', $value)->first();
                //
                //                        return $category?->id;
                //                    },
                //                ],

                // Supplier by code
                //                'supplier_code' => [
                //                    'label' => 'Codice Fornitore',
                //                    'description' => 'Codice fornitore (es. SUP-00001)',
                //                    'example' => 'SUP-00001',
                //                    'target' => 'default_supplier_id',
                //                    'transformer' => function ($value, $row) {
                //                        if (empty($value)) {
                //                            return null;
                //                        }
                //
                //                        $supplier = Supplier::where('code', $value)->first();
                //
                //                        return $supplier?->id;
                //                    },
                //                ],

                // Full product code (brand + code)
                //                'full_code' => [
                //                    'label' => 'Codice Completo',
                //                    'description' => 'Codice prodotto completo (es. BTI 010). Sarà splittato in brand_id e code',
                //                    'example' => 'BTI 010',
                //                    'target' => '_multi', // Special: updates multiple fields
                //                    'transformer' => function ($value, $row) {
                //                        if (empty($value)) {
                //                            return null;
                //                        }
                //
                //                        // This is a special transformer that returns array
                //                        // It will be handled separately
                //                        $parts = preg_split('/[\s\-_]+/', trim($value), 2);
                //
                //                        if (count($parts) !== 2) {
                //                            return null;
                //                        }
                //
                //                        [$brandCode, $productCode] = $parts;
                //
                //                        // Find or create brand
                //                        $brand = Product::findOrCreateBrand($brandCode);
                //
                //                        return [
                //                            'brand_id' => $brand->id,
                //                            'code' => $productCode,
                //                        ];
                //                    },
                //                ],
            ],

            'supplier_product' => [
                // Discount family by code
                'discount_family_code' => [
                    'label' => 'Codice Famiglia Sconto',
                    'description' => 'Codice famiglia sconto fornitore (es. COM1)',
                    'example' => 'COM1',
                    'target' => 'discount_family_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value) || empty($row['supplier_id'])) {
                            return null;
                        }

                        $family = DiscountFamily::where('supplier_id', $row['supplier_id'])
                            ->where('code', $value)
                            ->first();

                        return $family?->id;
                    },
                ],

                // Payment term by code
                'payment_term_code' => [
                    'label' => 'Codice Termine Pagamento',
                    'description' => 'Codice condizione pagamento (es. NET30)',
                    'example' => 'NET30',
                    'target' => 'payment_term_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value)) {
                            return null;
                        }

                        $term = PaymentTerm::where('code', $value)->first();

                        return $term?->id;
                    },
                ],
            ],

            // Supplier Catalog (combines Product + SupplierProduct fields)
            'supplier_catalog' => [
                // === PRODUCT VIRTUAL FIELDS ===
                'brand' => [
                    'label' => 'Marca',
                    'description' => 'Marca (ID, codice o nome). Sarà convertito in brand_id',
                    'example' => 'BTI',
                    'target' => 'brand_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value)) {
                            return null;
                        }

                        // Try as ID first
                        if (is_numeric($value)) {
                            $brand = ProductBrand::find($value);
                            if ($brand) {
                                return $brand->id;
                            }
                        }

                        // Try as code
                        $brand = ProductBrand::where('code', strtoupper($value))->first();
                        if ($brand) {
                            return $brand->id;
                        }

                        // Try as name (case insensitive)
                        $brand = ProductBrand::whereRaw('LOWER(name) = ?', [strtolower($value)])->first();
                        if ($brand) {
                            return $brand->id;
                        }

                        // Auto-create brand if not exists
                        $brand = ProductBrand::create([
                            'name' => $value,
                            'code' => strtoupper(substr($value, 0, 10)),
                            'is_active' => true,
                        ]);

                        return $brand->id;
                    },
                ],

                'category' => [
                    'label' => 'Categoria',
                    'description' => 'Categoria (ID, codice o nome). Sarà convertito in category_id',
                    'example' => 'Elettrico',
                    'target' => 'category_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value)) {
                            return null;
                        }

                        // Try as ID first
                        if (is_numeric($value)) {
                            $category = ProductCategory::find($value);
                            if ($category) {
                                return $category->id;
                            }
                        }

                        // Try as code
                        $category = ProductCategory::where('code', strtoupper($value))->first();
                        if ($category) {
                            return $category->id;
                        }

                        // Try as name (case insensitive)
                        $category = ProductCategory::whereRaw('LOWER(name) = ?', [strtolower($value)])->first();
                        if ($category) {
                            return $category->id;
                        }

                        // Category not found, return null (don't auto-create categories)
                        return null;
                    },
                ],

                // === SUPPLIER_PRODUCT VIRTUAL FIELDS ===
                'supplier' => [
                    'label' => 'Fornitore',
                    'description' => 'Fornitore (ID, codice o nome)',
                    'example' => 'BTicino',
                    'target' => 'supplier_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value)) {
                            return null;
                        }

                        // Try as ID first
                        if (is_numeric($value)) {
                            $supplier = Supplier::find($value);
                            if ($supplier) {
                                return $supplier->id;
                            }
                        }

                        // Try as code
                        $supplier = Supplier::where('code', strtoupper($value))->first();
                        if ($supplier) {
                            return $supplier->id;
                        }

                        // Try as name (case insensitive)
                        $supplier = Supplier::whereRaw('LOWER(company_name) = ?', [strtolower($value)])->first();

                        return $supplier?->id;
                    },
                ],

                'discount_family' => [
                    'label' => 'Famiglia Sconto',
                    'description' => 'Famiglia sconto (codice)',
                    'example' => 'COM1',
                    'target' => 'discount_family_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value) || empty($row['supplier_id'])) {
                            return null;
                        }

                        $family = DiscountFamily::where('supplier_id', $row['supplier_id'])
                            ->where('code', strtoupper($value))
                            ->first();

                        return $family?->id;
                    },
                ],

                'payment_term' => [
                    'label' => 'Termine Pagamento',
                    'description' => 'Termine pagamento (codice)',
                    'example' => 'NET30',
                    'target' => 'payment_term_id',
                    'transformer' => function ($value, $row) {
                        if (empty($value)) {
                            return null;
                        }

                        $term = PaymentTerm::where('code', strtoupper($value))->first();

                        return $term?->id;
                    },
                ],
            ],
        ];
    }
}
