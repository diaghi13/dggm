<?php

namespace App\Http\Controllers\Api\V1\Products;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    /**
     * Get importable fields configuration for a specific model
     */
    public function getImportableFields(string $model): JsonResponse
    {
        $customizations = $this->getFieldCustomizations();

        if (! isset($customizations[$model])) {
            return response()->json([
                'success' => false,
                'message' => "Model '{$model}' not configured for import",
            ], 404);
        }

        // Get database columns metadata
        $dbColumns = DB::connection()->getSchemaBuilder()->getColumns($model);

        // Build fields configuration from DB
        $fields = [];
        foreach ($dbColumns as $column) {
            // Skip auto-generated and system fields
            if ($this->shouldSkipField($column['name'])) {
                continue;
            }

            // Check if field is customized
            $customization = $customizations[$model][$column['name']] ?? [];

            // Skip if explicitly hidden
            if (isset($customization['hidden']) && $customization['hidden'] === true) {
                continue;
            }

            // Build field configuration
            $fields[] = $this->buildFieldConfig($column, $customization);
        }

        // Add virtual fields (from ImportFieldTransformer)
        $virtualFields = \App\Services\ImportFieldTransformer::getVirtualFields($model);
        foreach ($virtualFields as $virtualField) {
            $fields[] = [
                'key' => $virtualField['key'],
                'label' => $virtualField['label'],
                'description' => $virtualField['description'],
                'required' => false,
                'type' => 'string',
                'example' => $virtualField['example'] ?? null,
                'is_virtual' => true,
                'transforms_to' => $virtualField['target'],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'model' => $model,
                'fields' => $fields,
            ],
        ]);
    }

    /**
     * Get all available models for import
     */
    public function getAvailableModels(): JsonResponse
    {
        $customizations = $this->getFieldCustomizations();

        $models = array_map(function ($model) {
            $dbColumns = DB::connection()->getSchemaBuilder()->getColumns($model);
            $importableCount = count(array_filter($dbColumns, fn ($col) => ! $this->shouldSkipField($col['name'])));

            return [
                'key' => $model,
                'label' => ucfirst($model),
                'fields_count' => $importableCount,
            ];
        }, array_keys($customizations));

        return response()->json([
            'success' => true,
            'data' => $models,
        ]);
    }

    /**
     * Check if a field should be skipped from import
     */
    private function shouldSkipField(string $fieldName): bool
    {
        $skipFields = [
            'id',
            'created_at',
            'updated_at',
            'deleted_at',
        ];

        return in_array($fieldName, $skipFields);
    }

    /**
     * Build field configuration from database column and customization
     */
    private function buildFieldConfig(array $column, array $customization): array
    {
        $fieldType = $this->mapDatabaseTypeToFieldType($column['type_name']);
        $hasDefault = ! empty($column['default']) || $column['default'] === '0' || $column['default'] === 0;
        $required = empty($column['nullable']) && ! $hasDefault && ! $column['auto_increment'];

        $config = [
            'key' => $column['name'],
            'label' => $customization['label'] ?? $this->generateLabel($column['name']),
            'required' => $customization['required'] ?? $required,
            'type' => $customization['type'] ?? $fieldType,
            'description' => $customization['description'] ?? $column['comment'] ?? $this->generateDescription($column['name']),
        ];

        // Add default value if present
        if ($hasDefault) {
            $config['default'] = $this->formatDefaultValue($column['default'], $column['type_name']);
        }

        // Build validation rules
        $validation = $this->buildValidationRules($column);
        if ($validation) {
            $config['validation'] = $validation;
        }

        // Add custom validation if provided
        if (isset($customization['additional_validation'])) {
            $config['validation'] = isset($config['validation'])
                ? $config['validation'].'|'.$customization['additional_validation']
                : $customization['additional_validation'];
        }

        // Add example if provided
        if (isset($customization['example'])) {
            $config['example'] = $customization['example'];
        }

        // Add options for enums/selects
        if (isset($customization['options'])) {
            $config['options'] = $customization['options'];
        }

        return $config;
    }

    /**
     * Map database type to field type
     */
    private function mapDatabaseTypeToFieldType(string $dbType): string
    {
        return match ($dbType) {
            'text', 'longtext', 'mediumtext' => 'text',
            'int', 'bigint', 'smallint' => 'integer',
            'decimal', 'float', 'double' => 'decimal',
            'tinyint' => 'boolean',
            'date' => 'date',
            'datetime', 'timestamp' => 'datetime',
            'json' => 'json',
            default => 'string',
        };
    }

    /**
     * Build validation rules from database column metadata
     */
    private function buildValidationRules(array $column): string
    {
        $rules = [];
        $hasDefault = ! empty($column['default']) || $column['default'] === '0' || $column['default'] === 0;

        // Required, nullable, or optional (has default)
        if (empty($column['nullable']) && ! $hasDefault && ! $column['auto_increment']) {
            $rules[] = 'required';
        } elseif (! $hasDefault) {
            $rules[] = 'nullable';
        }
        // If has default, it's optional - no need for required or nullable

        // Type-based validation
        switch ($column['type_name']) {
            case 'varchar':
            case 'char':
                $rules[] = 'string';
                // Extract max length from type (e.g., "varchar(255)")
                if (preg_match('/\((\d+)\)/', $column['type'], $matches)) {
                    $rules[] = 'max:'.$matches[1];
                }
                break;

            case 'text':
            case 'longtext':
            case 'mediumtext':
                $rules[] = 'string';
                break;

            case 'int':
            case 'bigint':
            case 'smallint':
                $rules[] = 'integer';
                break;

            case 'decimal':
            case 'float':
            case 'double':
                $rules[] = 'numeric';
                if ($hasDefault && ($column['default'] === '0.00' || $column['default'] === 0)) {
                    $rules[] = 'min:0';
                }
                break;

            case 'tinyint':
                $rules[] = 'boolean';
                break;

            case 'date':
            case 'datetime':
            case 'timestamp':
                $rules[] = 'date';
                break;

            case 'json':
                $rules[] = 'array';
                break;
        }

        return implode('|', $rules);
    }

    /**
     * Format default value based on field type
     */
    private function formatDefaultValue(mixed $default, string $dbType): mixed
    {
        return match ($dbType) {
            'tinyint' => (bool) $default,
            'int', 'bigint', 'smallint' => (int) $default,
            'decimal', 'float', 'double' => (float) $default,
            default => $default,
        };
    }

    /**
     * Generate human-readable label from field name
     */
    private function generateLabel(string $fieldName): string
    {
        // Remove _id suffix for foreign keys
        $cleanName = preg_replace('/_id$/', '', $fieldName);

        // Convert snake_case to Title Case
        return ucwords(str_replace('_', ' ', $cleanName));
    }

    /**
     * Generate description from field name
     */
    private function generateDescription(string $fieldName): string
    {
        $label = $this->generateLabel($fieldName);

        return "Campo {$label}";
    }

    /**
     * Import supplier catalog (product + supplier_product combined)
     */
    public function importSupplierCatalog(Request $request): JsonResponse
    {
        $this->authorize('create', \App\Domains\Product\Models\Product::class);

        $validated = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'rows' => 'required|array|min:1',
            'rows.*.code' => 'required|string|max:255',
            'rows.*.name' => 'required|string|max:255',
            'rows.*.purchase_price' => 'required|numeric|min:0',
            'rows.*.unit' => 'nullable|string|max:50',
            'rows.*.brand' => 'nullable',
            'rows.*.category' => 'nullable',
            'rows.*.description' => 'nullable|string',
            'rows.*.ean' => 'nullable|string|max:13',
            'rows.*.etim_code' => 'nullable|string|max:20',
            'rows.*.barcode' => 'nullable|string|max:255',
            'rows.*.supplier_product_code' => 'nullable|string|max:100',
            'rows.*.supplier_ean' => 'nullable|string|max:13',
            'rows.*.wholesale_price' => 'nullable|numeric|min:0',
            'rows.*.retail_price' => 'nullable|numeric|min:0',
            'rows.*.discount_family' => 'nullable|string',
            'rows.*.manual_discount_1' => 'nullable|numeric|between:0,100',
            'rows.*.manual_discount_2' => 'nullable|numeric|between:0,100',
            'rows.*.manual_discount_3' => 'nullable|numeric|between:0,100',
            'rows.*.package_quantity' => 'nullable|integer|min:1',
            'rows.*.minimum_order_quantity' => 'nullable|integer|min:1',
            'rows.*.maximum_order_quantity' => 'nullable|integer|min:1',
            'rows.*.multiple_order_quantity' => 'nullable|integer|min:1',
            'rows.*.lead_time_days' => 'nullable', // Can be numeric or string, sanitized later
            'rows.*.payment_term' => 'nullable|string',
            'rows.*.price_multiplier' => 'nullable|numeric|min:0',
            'rows.*.currency' => 'nullable|string|max:3',
            'rows.*.is_active' => 'nullable|boolean',
        ]);

        $importAction = new \App\Actions\SupplierProduct\ImportSupplierCatalogAction(
            new \App\Actions\SupplierProduct\UpsertSupplierProductAction,
            app(\App\Domains\Product\Actions\CreateProductAction::class),
            app(\App\Domains\Product\Actions\UpdateProductAction::class)
        );

        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];

        foreach ($validated['rows'] as $index => $row) {
            try {
                // Inject supplier_id if not in row
                $row['supplier_id'] = $row['supplier_id'] ?? $validated['supplier_id'];

                // Sanitize lead_time_days: convert non-numeric to default (7 days)
                if (isset($row['lead_time_days']) && ! is_numeric($row['lead_time_days'])) {
                    $row['lead_time_days'] = 7;
                }

                $result = $importAction->execute($row);

                if ($result['action'] === 'created') {
                    $imported++;
                } else {
                    $updated++;
                }
            } catch (\Exception $e) {
                $skipped++;
                $errors[] = "Riga {$index}: {$e->getMessage()}";
            }
        }

        return response()->json([
            'success' => true,
            'message' => "{$imported} importati, {$updated} aggiornati, {$skipped} saltati",
            'data' => compact('imported', 'updated', 'skipped', 'errors'),
        ]);
    }

    /**
     * Field customizations for importable models
     * Only override what you need - everything else is auto-generated from DB
     *
     * Available customization options:
     * - label: Custom label for the field
     * - description: Custom description
     * - type: Override field type
     * - required: Override required status
     * - example: Example value/placeholder
     * - additional_validation: Extra Laravel validation rules
     * - options: Array of options for select/enum fields
     * - hidden: Set to true to hide field from import (default: false)
     */
    private function getFieldCustomizations(): array
    {
        return [
            'products' => [
                'code' => [
                    'label' => 'Codice Prodotto',
                    'description' => 'Codice produttore (es. 010 per BTicino). Se prodotto custom, verrà auto-generato',
                    'required' => false,
                    'example' => '010',
                ],
                'internal_code' => [
                    'label' => 'Codice Interno',
                    'description' => 'Codice fake per clienti (auto-generato se vuoto)',
                    'required' => false,
                    'example' => 'BTI-PUSILLU',
                ],
                'brand_id' => [
                    'label' => 'Marca',
                    'type' => 'integer',
                    'description' => 'ID della marca (product_brands)',
                    'additional_validation' => 'exists:product_brands,id',
                    'example' => '1',
                    'hidden' => true, // Use virtual fields brand_code or brand_name instead
                ],
                'ean' => [
                    'label' => 'Codice EAN',
                    'description' => 'Barcode internazionale EAN-13',
                    'example' => '8014496006615',
                ],

                // Note: Virtual fields are automatically added from ImportFieldTransformer
                // Available virtual fields:
                // - brand_code: Sigla marca (es. BTI) → viene convertito in brand_id
                // - brand_name: Nome marca (es. BTicino) → viene convertito in brand_id
                // - category_code: Codice categoria → viene convertito in category_id
                // - supplier_code: Codice fornitore → viene convertito in default_supplier_id
                // - full_code: Codice completo "BTI 010" → viene splittato in brand_id + code
                'etim_code' => [
                    'label' => 'Codice ETIM',
                    'description' => 'Classificazione ETIM europea',
                    'example' => 'EC001351',
                ],
                'name' => [
                    'label' => 'Nome Prodotto',
                    'description' => 'Nome del prodotto',
                    'example' => 'Mattone rosso',
                ],
                'description' => [
                    'label' => 'Descrizione',
                    'description' => 'Descrizione dettagliata del prodotto',
                    'example' => 'Mattone rosso per muratura',
                ],
                'category_id' => [
                    'label' => 'Categoria',
                    'type' => 'integer',
                    'description' => 'ID della categoria di appartenenza',
                    'additional_validation' => 'exists:categories,id',
                    'example' => '1',
                    'hidden' => true, // Use virtual fields category_code instead
                ],
                'product_type' => [
                    'label' => 'Tipo Prodotto',
                    'type' => 'enum',
                    'description' => 'Tipologia del prodotto',
                    'additional_validation' => 'in:physical,service,digital',
                    'options' => ['physical', 'service', 'digital'],
                    'example' => 'physical',
                    'hidden' => true,
                ],
                'is_package' => [
                    'label' => 'È un Pacco',
                    'description' => 'Indica se il prodotto è venduto in confezioni',
                    'example' => '0',
                ],
                'package_weight' => [
                    'label' => 'Peso Confezione',
                    'description' => 'Peso della confezione in kg',
                    'example' => '2.50',
                ],
                'package_volume' => [
                    'label' => 'Volume Confezione',
                    'description' => 'Volume della confezione in m³',
                    'example' => '0.05',
                ],
                'package_dimensions' => [
                    'label' => 'Dimensioni Confezione',
                    'description' => 'Dimensioni nel formato LxWxH in cm',
                    'example' => '30x20x15',
                ],
                'is_rentable' => [
                    'label' => 'Noleggiabile',
                    'description' => 'Indica se il prodotto può essere noleggiato',
                    'example' => '0',
                ],
                'unit' => [
                    'label' => 'Unità di Misura',
                    'description' => 'Unità di misura (pz, kg, m, m2, m3, l, ecc.)',
                    'example' => 'pz',
                ],
                'standard_cost' => [
                    'label' => 'Costo Standard',
                    'description' => 'Costo standard del prodotto',
                    'example' => '8.50',
                ],
                'purchase_price' => [
                    'label' => 'Prezzo di Acquisto',
                    'description' => 'Prezzo di acquisto dal fornitore',
                    'example' => '10.00',
                ],
                'markup_percentage' => [
                    'label' => 'Ricarico %',
                    'description' => 'Percentuale di ricarico sul prezzo di acquisto',
                    'example' => '25.00',
                ],
                'sale_price' => [
                    'label' => 'Prezzo di Vendita',
                    'description' => 'Prezzo di vendita al cliente',
                    'example' => '12.50',
                ],
                'rental_price_daily' => [
                    'label' => 'Prezzo Noleggio Giornaliero',
                    'description' => 'Prezzo per il noleggio giornaliero',
                    'example' => '5.00',
                ],
                'rental_price_weekly' => [
                    'label' => 'Prezzo Noleggio Settimanale',
                    'description' => 'Prezzo per il noleggio settimanale',
                    'example' => '30.00',
                ],
                'rental_price_monthly' => [
                    'label' => 'Prezzo Noleggio Mensile',
                    'description' => 'Prezzo per il noleggio mensile',
                    'example' => '100.00',
                ],
                'barcode' => [
                    'label' => 'Codice a Barre',
                    'description' => 'Codice a barre EAN/UPC',
                    'example' => '1234567890123',
                ],
                'qr_code' => [
                    'label' => 'Codice QR',
                    'description' => 'Codice QR del prodotto',
                    'example' => 'QR-PROD001',
                ],
                'default_supplier_id' => [
                    'label' => 'Fornitore Predefinito',
                    'type' => 'integer',
                    'description' => 'ID del fornitore predefinito',
                    'additional_validation' => 'exists:suppliers,id',
                    'example' => '5',
                    'hidden' => true,
                ],
                'reorder_level' => [
                    'label' => 'Livello di Riordino',
                    'description' => 'Quantità minima che attiva il riordino',
                    'example' => '10.00',
                ],
                'reorder_quantity' => [
                    'label' => 'Quantità di Riordino',
                    'description' => 'Quantità da ordinare quando si raggiunge il livello minimo',
                    'example' => '50.00',
                ],
                'lead_time_days' => [
                    'label' => 'Tempo di Consegna',
                    'description' => 'Tempo di consegna in giorni dal fornitore',
                    'example' => '7',
                ],
                'location' => [
                    'label' => 'Ubicazione',
                    'description' => 'Posizione fisica nel magazzino',
                    'example' => 'Scaffale A2-3',
                ],
                'notes' => [
                    'label' => 'Note',
                    'description' => 'Note aggiuntive sul prodotto',
                    'example' => 'Verificare disponibilità prima dell\'ordine',
                ],
                'is_active' => [
                    'label' => 'Attivo',
                    'description' => 'Indica se il prodotto è attivo e disponibile',
                    'example' => '1',
                    'hidden' => true,
                ],
            ],
            'customers' => [
                // Add customers customizations here if needed
            ],
            'suppliers' => [
                // Add suppliers customizations here if needed
            ],

            // Supplier Catalog (combines products + supplier_product)
            'supplier_catalog' => [
                // === PRODUCT FIELDS ===
                'code' => [
                    'label' => 'Codice Prodotto',
                    'description' => 'Codice prodotto (verrà creato se non esiste)',
                    'required' => true,
                    'example' => '010',
                ],
                'name' => [
                    'label' => 'Nome Prodotto',
                    'description' => 'Descrizione del prodotto',
                    'required' => true,
                    'example' => 'Interruttore Magnetotermico',
                ],
                'unit' => [
                    'label' => 'Unità di Misura',
                    'description' => 'Unità di misura (pz, mt, kg, ecc.)',
                    'example' => 'pz',
                ],
                'ean' => [
                    'label' => 'Codice EAN Prodotto',
                    'description' => 'Barcode EAN del prodotto',
                    'example' => '8014496006615',
                ],
                'etim_code' => [
                    'label' => 'Codice ETIM',
                    'description' => 'Classificazione ETIM europea',
                    'example' => 'EC001351',
                ],
                'brand_id' => [
                    'hidden' => true, // Use virtual field 'brand'
                ],
                'category_id' => [
                    'hidden' => true, // Use virtual field 'category'
                ],

                // === SUPPLIER_PRODUCT FIELDS ===
                'supplier_id' => [
                    'label' => 'Fornitore',
                    'description' => 'ID del fornitore (obbligatorio)',
                    'required' => true,
                    'type' => 'integer',
                    'hidden' => true, // Set via API parameter
                ],
                'supplier_product_code' => [
                    'label' => 'Codice Fornitore',
                    'description' => 'Codice interno del fornitore per questo prodotto',
                    'example' => 'BTI-010',
                ],
                'supplier_ean' => [
                    'label' => 'EAN Fornitore',
                    'description' => 'Codice EAN fornito dal fornitore',
                    'example' => '8014496006615',
                ],
                'purchase_price' => [
                    'label' => 'Prezzo Acquisto',
                    'description' => 'Prezzo di acquisto dal fornitore',
                    'required' => true,
                    'type' => 'decimal',
                    'example' => '12.50',
                ],
                'wholesale_price' => [
                    'label' => 'Prezzo Ingrosso',
                    'description' => 'Prezzo all\'ingrosso per rivenditori',
                    'type' => 'decimal',
                    'example' => '15.00',
                ],
                'retail_price' => [
                    'label' => 'Prezzo Pubblico',
                    'description' => 'Prezzo consigliato al pubblico',
                    'type' => 'decimal',
                    'example' => '20.00',
                ],
                'package_quantity' => [
                    'label' => 'Quantità Cartone',
                    'description' => 'Pezzi per cartone/confezione',
                    'type' => 'integer',
                    'example' => '6',
                ],
                'minimum_order_quantity' => [
                    'label' => 'Quantità Minima Ordine',
                    'description' => 'Quantità minima ordinabile',
                    'type' => 'integer',
                    'example' => '6',
                ],
                'maximum_order_quantity' => [
                    'label' => 'Quantità Massima Ordine',
                    'description' => 'Quantità massima ordinabile',
                    'type' => 'integer',
                    'example' => '999999',
                ],
                'multiple_order_quantity' => [
                    'label' => 'Multiplo Ordinazione',
                    'description' => 'L\'ordine deve essere multiplo di questo valore',
                    'type' => 'integer',
                    'example' => '6',
                ],
                'lead_time_days' => [
                    'label' => 'Tempo Consegna',
                    'description' => 'Giorni necessari per la consegna',
                    'type' => 'integer',
                    'example' => '7',
                ],
                'price_multiplier' => [
                    'label' => 'Moltiplicatore Prezzo',
                    'description' => 'Moltiplicatore da applicare al prezzo',
                    'type' => 'decimal',
                    'example' => '1.00',
                ],
                'currency' => [
                    'label' => 'Valuta',
                    'description' => 'Codice valuta ISO (EUR, USD, ecc.)',
                    'example' => 'EUR',
                ],
                'manual_discount_1' => [
                    'label' => 'Sconto 1 (%)',
                    'description' => 'Primo sconto a cascata',
                    'type' => 'decimal',
                    'example' => '10.00',
                ],
                'manual_discount_2' => [
                    'label' => 'Sconto 2 (%)',
                    'description' => 'Secondo sconto a cascata',
                    'type' => 'decimal',
                    'example' => '5.00',
                ],
                'manual_discount_3' => [
                    'label' => 'Sconto 3 (%)',
                    'description' => 'Terzo sconto a cascata',
                    'type' => 'decimal',
                    'example' => '2.00',
                ],
                'discount_family_id' => [
                    'hidden' => true, // Use virtual field 'discount_family'
                ],
                'payment_term_id' => [
                    'hidden' => true, // Use virtual field 'payment_term'
                ],
                'is_active' => [
                    'label' => 'Attivo',
                    'description' => 'Indica se il prodotto è attivo per questo fornitore',
                    'type' => 'boolean',
                    'example' => true,
                ],
            ],
        ];
    }
}
