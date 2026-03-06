<?php

namespace App\Models;

use App\Data\ProductData;
use App\Enums\ProductType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Image\Enums\Fit;
use Spatie\LaravelData\WithData;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Product extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes, WithData;

    protected $table = 'products';

    protected string $dataClass = ProductData::class;

    protected $fillable = [
        'id',
        'code',
        'internal_code',
        'name',
        'description',
        'brand_id',
        'category_id',
        'product_type',
        'ean',
        'etim_code',
        'is_package',
        'package_weight',
        'package_volume',
        'package_dimensions',
        'is_rentable',
        'ownership_type',
        'is_premium',
        'subrental_markup',
        'rental_price_estimated',
        'estimated_base_day',
        'quantity_out_on_rental',
        'unit',
        'standard_cost',
        'manufacturer_cost_price',
        'manufacturer_retail_price',
        'sale_markup_percent',
        'barcode',
        'qr_code',
        'default_supplier_id',
        'reorder_level',
        'reorder_quantity',
        'lead_time_days',
        'location',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'product_type' => ProductType::class,
            'standard_cost' => 'decimal:2',
            'manufacturer_cost_price' => 'decimal:2',
            'manufacturer_retail_price' => 'decimal:2',
            'sale_markup_percent' => 'decimal:2',
            'reorder_level' => 'decimal:2',
            'reorder_quantity' => 'decimal:2',
            'package_weight' => 'decimal:2',
            'package_volume' => 'decimal:2',
            'is_package' => 'boolean',
            'is_rentable' => 'boolean',
            'ownership_type' => 'string',
            'is_premium' => 'boolean',
            'subrental_markup' => 'decimal:2',
            'rental_price_estimated' => 'boolean',
            'estimated_base_day' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function brand(): BelongsTo
    {
        return $this->belongsTo(ProductBrand::class, 'brand_id');
    }

    public function defaultSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'default_supplier_id');
    }

    public function suppliers()
    {
        return $this->belongsToMany(Supplier::class, 'supplier_product')
            ->withPivot([
                'supplier_product_code',
                'supplier_ean',
                'purchase_price',
                'wholesale_price',
                'retail_price',
                'discount_family_id',
                'manual_discount_1',
                'manual_discount_2',
                'manual_discount_3',
                'package_quantity',
                'minimum_order_quantity',
                'maximum_order_quantity',
                'multiple_order_quantity',
                'lead_time_days',
                'payment_term_id',
                'price_multiplier',
                'currency',
                'last_price_update',
                'is_preferred_supplier',
                'is_active',
                'notes',
            ])
            ->withTimestamps();
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(Inventory::class, 'product_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'material_id');
    }

    public function projectMaterials(): HasMany
    {
        return $this->hasMany(ProjectMaterial::class, 'product_id');
    }

    public function subrentalCostHistory(): HasMany
    {
        return $this->hasMany(SubrentalCostHistory::class);
    }

    // Category relationship (NEW)
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function subrentalSuppliers(): HasMany
    {
        return $this->hasMany(ProductSubrentalSupplier::class);
    }

    public function preferredSubrentalSupplier(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ProductSubrentalSupplier::class)->where('is_preferred', true);
    }

    public function embedding(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ProductEmbedding::class);
    }

    /**
     * Price list items for this product
     */
    public function priceListItems(): HasMany
    {
        return $this->hasMany(PriceListItem::class, 'product_id');
    }

    /**
     * Active price list items only
     */
    public function activePriceListItems(): HasMany
    {
        return $this->priceListItems()
            ->where('is_active', true)
            ->whereHas('priceList', fn ($q) => $q->where('is_active', true));
    }

    // Product Relations (NEW unified table)
    /**
     * @return HasMany<ProductRelation>
     */
    public function relations(): HasMany
    {
        return $this->hasMany(ProductRelation::class, 'product_id')
            ->with(['relatedProduct', 'relationType']);
    }

    public function usedInRelations(): HasMany
    {
        return $this->hasMany(ProductRelation::class, 'related_product_id');
    }

    // Helper methods for backward compatibility + convenience
    public function components(): HasMany
    {
        return $this->relations()->components();
    }

    public function dependencies()
    {
        return $this->relations()->dependencies();
    }

    public function visibleInQuote()
    {
        return $this->relations()->visibleInQuote();
    }

    public function visibleInMaterialList()
    {
        return $this->relations()->visibleInMaterialList();
    }

    public function requiredForStock()
    {
        return $this->relations()->requiredForStock();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByBrandCode($query, string $brandCode)
    {
        return $query->whereHas('brand', function ($q) use ($brandCode) {
            $q->where('code', $brandCode);
        });
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeLowStock($query)
    {
        return $query->whereHas('inventory', function ($q) {
            $q->whereRaw('quantity_available <= minimum_stock');
        });
    }

    public function scopeByProductType($query, ProductType $type)
    {
        return $query->where('product_type', $type);
    }

    public function scopeRentable($query)
    {
        return $query->where('is_rentable', true);
    }

    public function scopeComposites($query)
    {
        return $query->where('product_type', ProductType::COMPOSITE);
    }

    public function scopeArticles($query)
    {
        return $query->where('product_type', ProductType::ARTICLE);
    }

    public function scopeServices($query)
    {
        return $query->where('product_type', ProductType::SERVICE);
    }

    // Accessors (Laravel 11 Attribute style)

    /**
     * Get effective markup percent (product override or system default)
     */
    protected function effectiveMarkupPercent(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->sale_markup_percent
                ?? (float) Setting::get('pricing.default_sale_markup_percent', 30)
        );
    }

    /**
     * Get highest supplier purchase price (for price list calculation)
     */
    protected function highestSupplierPrice(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->suppliers()
                ->wherePivot('is_active', true)
                ->max('supplier_product.purchase_price')
        );
    }

    /**
     * Get effective purchase price for calculations
     * Priority: highest supplier price > manufacturer cost > 0
     */
    protected function effectivePurchasePrice(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->highest_supplier_price
                ?? $this->manufacturer_cost_price
                ?? 0
        );
    }

    protected function totalStock(): Attribute
    {
        return Attribute::make(
            get: fn () => (float) $this->inventory()->sum('quantity_available')
        );
    }

    protected function totalReserved(): Attribute
    {
        return Attribute::make(
            get: fn () => (float) $this->inventory()->sum('quantity_reserved')
        );
    }

    protected function availableStock(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->total_stock - $this->total_reserved - $this->quantity_out_on_rental
        );
    }

    protected function compositeTotalCost(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->product_type !== ProductType::COMPOSITE) {
                    return 0;
                }

                return (float) $this->components()->with('relatedProduct')
                    ->get()
                    ->sum(fn ($component) => $component->calculateQuantity(1) * $component->relatedProduct->effective_purchase_price);
            }
        );
    }

    // Business methods

    public function rentOut(float $quantity): bool
    {
        if (! $this->is_rentable) {
            return false;
        }

        if ($this->available_stock < $quantity) {
            return false;
        }

        $this->quantity_out_on_rental += $quantity;

        return $this->save();
    }

    public function rentReturn(float $quantity): bool
    {
        $this->quantity_out_on_rental = max(0, $this->quantity_out_on_rental - $quantity);

        return $this->save();
    }

    /**
     * Calculate all relations for a given quantity (NEW unified method)
     *
     * @return array ['quote' => [...], 'material' => [...], 'stock' => [...]]
     */
    public function calculateAllRelations(float $quantity): array
    {
        $relations = $this->relations()->ordered()->get();

        $result = [
            'quote' => [],      // LISTA 1: Preventivo
            'material' => [],   // LISTA 2: Cantiere
            'stock' => [],      // LISTA 3: Magazzino
        ];

        foreach ($relations as $relation) {
            if (! $relation->shouldApply($quantity)) {
                continue;
            }

            $calculatedQty = $relation->calculateQuantity($quantity);

            if ($calculatedQty > 0) {
                $item = [
                    'relation_id' => $relation->id,
                    'relation_type' => $relation->relationType->name,
                    'product_id' => $relation->related_product_id,
                    'product' => $relation->relatedProduct,
                    'quantity' => $calculatedQty,
                    'unit_price' => 0, // Price comes from price_list_items
                    'total_price' => 0, // Price comes from price_list_items
                    'is_optional' => $relation->is_optional,
                ];

                // Add to appropriate lists
                if ($relation->is_visible_in_quote) {
                    $result['quote'][] = $item;
                }
                if ($relation->is_visible_in_material_list) {
                    $result['material'][] = $item;
                }
                if ($relation->is_required_for_stock) {
                    $result['stock'][] = $item;
                }
            }
        }

        return $result;
    }

    /**
     * Calculate composite cost (updated to use new relations)
     */
    public function calculateCompositeCost(): float
    {
        if ($this->product_type !== ProductType::COMPOSITE) {
            return 0;
        }

        return (float) $this->components()
            ->with('relatedProduct')
            ->get()
            ->sum(fn ($rel) => $rel->calculateQuantity(1) * $rel->relatedProduct->effective_purchase_price);
    }

    /**
     * Calculate composite sale price as sum of component sale prices × quantity.
     *
     * Delegates to ProductPricingService::calculateCompositePrices() so the
     * logic lives in the service layer (service for calculations — no DB writes).
     */
    public function calculateCompositeSalePrice(): float
    {
        if ($this->product_type !== ProductType::COMPOSITE) {
            return 0.0;
        }

        $prices = app(\App\Services\ProductPricingService::class)->calculateCompositePrices($this);

        return $prices['sale_price'];
    }

    /**
     * Register media collections and conversions
     */
    public function registerMediaCollections(): void
    {
        // Images collection with conversions
        $this->addMediaCollection('images')
            ->useFallbackUrl('/images/product-placeholder.png')
            ->useFallbackPath(public_path('/images/product-placeholder.png'))
            ->registerMediaConversions(function (Media $media) {
                $this->addMediaConversion('thumb')
                    ->fit(Fit::Crop, 150, 150)
                    ->nonQueued();

                $this->addMediaConversion('medium')
                    ->fit(Fit::Max, 800, 600)
                    ->nonQueued();

                $this->addMediaConversion('responsive')
                    ->withResponsiveImages()
                    ->nonQueued();
            });

        // Technical sheets collection
        $this->addMediaCollection('technical_sheets');

        // Certifications collection
        $this->addMediaCollection('certifications');

        // Manuals collection
        $this->addMediaCollection('manuals');

        // Drawings collection
        $this->addMediaCollection('drawings');

        // Documents collection (generic)
        $this->addMediaCollection('documents');
    }

    /**
     * Get primary image for the product
     */
    public function getPrimaryImage(): ?Media
    {
        return $this->getMedia('images')
            ->first(fn (Media $media) => $media->getCustomProperty('is_primary', false) === true)
            ?? $this->getFirstMedia('images');
    }

    /**
     * Get images marked for use in quotes
     */
    public function getImagesForQuotes()
    {
        return $this->getMedia('images')
            ->filter(fn (Media $media) => $media->getCustomProperty('use_in_quotes', false) === true);
    }

    /**
     * Get all media (any collection) marked for use in quotes
     * Includes both images and documents (PDFs, technical sheets, etc.)
     */
    public function getMediaForQuotes(): \Illuminate\Support\Collection
    {
        $documentCollections = ['technical_sheets', 'certifications', 'manuals', 'drawings', 'documents'];

        $images = $this->getImagesForQuotes();

        $documents = collect();
        foreach ($documentCollections as $collection) {
            $documents = $documents->merge(
                $this->getMedia($collection)
                    ->filter(fn (Media $media) => $media->getCustomProperty('use_in_quotes', false) === true)
            );
        }

        return $images->merge($documents);
    }

    /**
     * Get documents (non-image) marked for use in quotes
     */
    public function getDocumentsForQuotes(): \Illuminate\Support\Collection
    {
        $documentCollections = ['technical_sheets', 'certifications', 'manuals', 'drawings', 'documents'];

        $documents = collect();
        foreach ($documentCollections as $collection) {
            $documents = $documents->merge(
                $this->getMedia($collection)
                    ->filter(fn (Media $media) => $media->getCustomProperty('use_in_quotes', false) === true)
            );
        }

        return $documents;
    }

    /**
     * Get images marked for use in projects
     */
    public function getImagesForProjects()
    {
        return $this->getMedia('images')
            ->filter(fn (Media $media) => $media->getCustomProperty('use_in_projects', false) === true);
    }

    /**
     * Get technical sheets
     */
    public function getTechnicalSheets()
    {
        return $this->getMedia('technical_sheets');
    }

    /**
     * Get certifications
     */
    public function getCertifications()
    {
        return $this->getMedia('certifications');
    }

    /**
     * Calculate rental prices from sale price
     *
     * @param  float  $salePrice  Base sale price (net, VAT excluded)
     * @return array ['daily' => float, 'weekly' => float, 'monthly' => float]
     */
    public function calculateRentalPrices(float $salePrice): array
    {
        $dailyDivisor = (float) Setting::get('rental.daily_rate_percent', 15);
        $weeklyMultiplier = (float) Setting::get('rental.weekly_multiplier', sqrt(7));
        $monthlyMultiplier = (float) Setting::get('rental.monthly_multiplier', sqrt(30));

        $daily = $salePrice / $dailyDivisor;

        return [
            'daily' => round($daily, 2),
            'weekly' => round($daily * $weeklyMultiplier, 2),
            'monthly' => round($daily * $monthlyMultiplier, 2),
        ];
    }

    /**
     * Calculate base sale price with markup (for price list generation)
     *
     * @return float Calculated price (net, VAT excluded)
     */
    public function calculateBaseSalePrice(): float
    {
        $purchasePrice = $this->effective_purchase_price;
        $markup = $this->effective_markup_percent;

        return round($purchasePrice * (1 + ($markup / 100)), 2);
    }

    // ==================== HELPER METHODS FOR IMPORT ====================

    /**
     * Find product by brand code and product code
     * Example: findByBrandAndCode('BTI', '010')
     */
    public static function findByBrandAndCode(string $brandCode, string $productCode): ?self
    {
        return self::whereHas('brand', function ($q) use ($brandCode) {
            $q->where('code', $brandCode);
        })
            ->where('code', $productCode)
            ->first();
    }

    /**
     * Find product by full code (brand + product concatenated)
     * Example: findByFullCode('BTI 010') or findByFullCode('BTI-010')
     * Supports: "BTI 010", "BTI-010", "BTI_010"
     */
    public static function findByFullCode(string $fullCode): ?self
    {
        // Split by space, dash, or underscore
        $parts = preg_split('/[\s\-_]+/', trim($fullCode), 2);

        if (count($parts) !== 2) {
            return null;
        }

        [$brandCode, $productCode] = $parts;

        return self::findByBrandAndCode($brandCode, $productCode);
    }

    /**
     * Find or create brand by code or name
     */
    public static function findOrCreateBrand(string $codeOrName): ProductBrand
    {
        // Try to find by code first (exact match)
        $brand = ProductBrand::where('code', strtoupper($codeOrName))->first();

        if ($brand) {
            return $brand;
        }

        // Try to find by name (case insensitive)
        $brand = ProductBrand::whereRaw('LOWER(name) = ?', [strtolower($codeOrName)])->first();

        if ($brand) {
            return $brand;
        }

        // Create new brand
        return ProductBrand::create([
            'name' => $codeOrName,
            'is_active' => true,
        ]);
    }

    /**
     * Map supplier unit to standard unit code using ProductUnitType
     *
     * @param  string  $supplierUnit  Unit string from supplier (e.g., "kg", "KG", "meter", "pz")
     * @return string Standard unit code
     */
    private static function mapUnit(string $supplierUnit): string
    {
        $unit = ProductUnitType::findByAlias($supplierUnit);

        return $unit ? $unit->code : 'pz'; // Default to 'pz' if not found
    }

    /**
     * Create or update product from supplier data (Excel import)
     *
     * @param  array  $data  Supplier data from Excel
     */
    public static function createOrUpdateFromSupplierData(array $data, int $supplierId): self
    {
        // 1. Find or create brand
        $brand = null;
        if (! empty($data['brand_code']) || ! empty($data['brand_name'])) {
            $brandIdentifier = $data['brand_code'] ?? $data['brand_name'];
            $brand = self::findOrCreateBrand($brandIdentifier);
        }

        // 2. Try to find existing product by EAN (most reliable)
        $product = null;
        if (! empty($data['ean'])) {
            $product = self::where('ean', $data['ean'])->first();
        }

        // 3. If not found by EAN, try by code + brand
        if (! $product && ! empty($data['code']) && $brand) {
            $product = self::findByBrandAndCode($brand->code, $data['code']);
        }

        // 4. Prepare product data
        $productData = [
            'name' => $data['name'] ?? $data['description'] ?? 'Unknown Product',
            'code' => $data['code'] ?? null,
            'brand_id' => $brand?->id,
            'ean' => $data['ean'] ?? null,
            'etim_code' => $data['etim_code'] ?? null,
            'unit' => self::mapUnit($data['unit'] ?? 'pz'),
            'product_type' => $data['product_type'] ?? ProductType::ARTICLE,

            // NEW: Manufacturer reference prices (optional)
            'manufacturer_cost_price' => $data['manufacturer_cost_price'] ?? $data['manufacturer_cost'] ?? $data['cost_price'] ?? null,
            'manufacturer_retail_price' => $data['manufacturer_retail_price'] ?? $data['manufacturer_retail'] ?? $data['msrp'] ?? $data['rrp'] ?? null,
            'sale_markup_percent' => $data['sale_markup_percent'] ?? null,
        ];

        // 5. Create or update product
        if ($product) {
            $product->update(array_filter($productData, fn ($value) => $value !== null));
        } else {
            $product = self::create(array_merge($productData, [
                'standard_cost' => 0,
            ]));
        }

        // 6. Attach/update supplier relationship
        $supplierData = [
            'supplier_product_code' => $data['supplier_code'] ?? $data['code'],
            'supplier_ean' => $data['supplier_ean'] ?? $data['ean'],
            'purchase_price' => $data['purchase_price'] ?? $data['wholesale_price'] ?? 0,
            'wholesale_price' => $data['wholesale_price'] ?? null,
            'retail_price' => $data['retail_price'] ?? null,
            'package_quantity' => $data['package_quantity'] ?? 1,
            'minimum_order_quantity' => $data['minimum_order_quantity'] ?? 1,
            'maximum_order_quantity' => $data['maximum_order_quantity'] ?? null,
            'multiple_order_quantity' => $data['multiple_order_quantity'] ?? null,
            'lead_time_days' => $data['lead_time_days'] ?? null,
            'price_multiplier' => $data['price_multiplier'] ?? 1.00,
            'currency' => $data['currency'] ?? 'EUR',
            'last_price_update' => $data['last_price_update'] ?? now(),
            'is_active' => $data['is_active'] ?? true,
        ];

        // Find discount family if provided
        if (! empty($data['discount_family_code'])) {
            $discountFamily = DiscountFamily::where('supplier_id', $supplierId)
                ->where('code', $data['discount_family_code'])
                ->first();

            if ($discountFamily) {
                $supplierData['discount_family_id'] = $discountFamily->id;
            }
        }

        $product->suppliers()->syncWithoutDetaching([
            $supplierId => $supplierData,
        ]);

        return $product->fresh();
    }

    /**
     * Validate recursive composite structure
     * A composite can contain articles, services, or other composites
     */
    public function validateCompositeStructure(): bool
    {
        if ($this->product_type !== ProductType::COMPOSITE) {
            return true;
        }

        // Check for circular dependencies
        return ! $this->hasCircularDependency();
    }

    /**
     * Check for circular dependencies in composite products
     */
    protected function hasCircularDependency(array $visited = []): bool
    {
        if (in_array($this->id, $visited)) {
            return true; // Circular dependency detected
        }

        $visited[] = $this->id;

        foreach ($this->components as $component) {
            $product = $component->relatedProduct;

            if (! $product) {
                continue;
            }

            if ($product->product_type === ProductType::COMPOSITE) {
                if ($product->hasCircularDependency($visited)) {
                    return true;
                }
            }
        }

        return false;
    }

    // Boot
    protected static function booted(): void
    {
        // Gate::resource('product', ProductPolicy::class);

        static::creating(function ($product) {
            // Auto-generate code if empty (manufacturer code or auto-generated)
            if (empty($product->code)) {
                $product->code = app(\App\Services\CodeGeneratorService::class)->generate('product');
            }

            // Auto-generate internal_code (fake code for customers)
            if (empty($product->internal_code)) {
                $product->internal_code = self::generateInternalCode($product);
            }
        });

        static::creating(function ($product) {
            if ($product->product_type !== ProductType::COMPOSITE && $product->components()->count() > 0) {
                throw new \Exception('Only COMPOSITE products can have components');
            }
        });

        static::updating(function ($product) {
            // Validate composite structure before saving
            if ($product->product_type === ProductType::COMPOSITE) {
                if ($product->hasCircularDependency()) {
                    throw new \Exception('Circular dependency detected in composite product structure');
                }
            }
        });
    }

    /**
     * Generate internal code from product name (fake code for customers)
     * Format: [BRAND]-[ALPHANUMERIC_FROM_NAME]
     * Examples:
     * - "pulsante illuminabile" + BTI → "BTI-PUSILLU"
     * - "interruttore bipolare" + BTI → "BTI-INTBIPO"
     * - "kit trapano" + GEN → "GEN-KITTRA"
     */
    private static function generateInternalCode($product): string
    {
        // Get brand code
        $brandCode = 'GEN'; // Default generic
        if ($product->brand_id) {
            $brand = ProductBrand::find($product->brand_id);
            $brandCode = $brand?->code ?? 'GEN';
        }

        // Extract significant letters from product name
        $name = strtoupper(trim($product->name ?? ''));

        // Remove common words (articles, prepositions, conjunctions)
        $stopWords = ['IL', 'LO', 'LA', 'I', 'GLI', 'LE', 'UN', 'UNO', 'UNA', 'CON', 'PER', 'DI', 'DA', 'IN', 'SU', 'A', 'E', 'O'];
        $words = preg_split('/\s+/', $name);
        $filteredWords = array_filter($words, fn ($w) => ! in_array($w, $stopWords));

        // Build alphanumeric code from first letters of each significant word
        $nameCode = '';
        foreach ($filteredWords as $word) {
            // Take first 2-3 letters from each word (only alphabetic)
            $letters = preg_replace('/[^A-Z]/', '', $word);
            $nameCode .= substr($letters, 0, min(3, strlen($letters)));

            // Stop at max 8 characters
            if (strlen($nameCode) >= 8) {
                break;
            }
        }

        // Fallback if name is empty or too short
        if (strlen($nameCode) < 3) {
            $nameCode = substr(preg_replace('/[^A-Z0-9]/', '', $name), 0, 8);
        }

        // Limit to 8 characters
        $nameCode = substr($nameCode, 0, 8);

        // Combine brand + name code
        $code = $brandCode.'-'.$nameCode;

        // Ensure uniqueness
        $counter = 1;
        $originalCode = $code;
        while (self::where('internal_code', $code)->exists()) {
            $code = $originalCode.$counter;
            $counter++;
            if ($counter > 999) {
                throw new \Exception('Unable to generate unique internal code after 999 attempts');
            }
        }

        return $code;
    }
}
