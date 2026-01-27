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
use Spatie\LaravelData\WithData;

class Product extends Model
{
    use HasFactory, SoftDeletes, WithData;

    protected $table = 'products';

    protected string $dataClass = ProductData::class;

    protected $fillable = [
        'id',
        'code',
        'name',
        'description',
        'category_id',
        'product_type',
        'is_package',
        'package_weight',
        'package_volume',
        'package_dimensions',
        'is_rentable',
        'quantity_out_on_rental',
        'unit',
        'standard_cost',
        'purchase_price',
        'markup_percentage',
        'sale_price',
        'rental_price_daily',
        'rental_price_weekly',
        'rental_price_monthly',
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
            'purchase_price' => 'decimal:2',
            'markup_percentage' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'rental_price_daily' => 'decimal:2',
            'rental_price_weekly' => 'decimal:2',
            'rental_price_monthly' => 'decimal:2',
            'reorder_level' => 'decimal:2',
            'reorder_quantity' => 'decimal:2',
            'package_weight' => 'decimal:2',
            'package_volume' => 'decimal:2',
            'is_package' => 'boolean',
            'is_rentable' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function defaultSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'default_supplier_id');
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(Inventory::class, 'product_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'material_id');
    }

    public function siteAssignments(): HasMany
    {
        return $this->hasMany(SiteMaterial::class, 'material_id');
    }

    // Category relationship (NEW)
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    // Product Relations (NEW unified table)
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
    protected function calculatedSalePrice(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->markup_percentage > 0) {
                    return round($this->purchase_price * (1 + ($this->markup_percentage / 100)), 2);
                }

                return $this->sale_price;
            }
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

                return (float) $this->components()->with('product')
                    ->get()
                    ->sum(fn ($component) => $component->quantity * $component->product->purchase_price);
            }
        );
    }

    // Business methods
    public function calculateSalePrice(): void
    {
        if ($this->markup_percentage > 0) {
            $this->sale_price = $this->purchase_price * (1 + ($this->markup_percentage / 100));
        }
    }

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
                    'unit_price' => $relation->relatedProduct->sale_price ?? 0,
                    'total_price' => $calculatedQty * ($relation->relatedProduct->sale_price ?? 0),
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
            ->sum(fn ($rel) => $rel->calculateQuantity(1) * $rel->relatedProduct->purchase_price);
    }

    /**
     * Calculate composite sale price (updated to use new relations)
     */
    public function calculateCompositeSalePrice(): float
    {
        if ($this->product_type !== ProductType::COMPOSITE) {
            return $this->sale_price ?? 0;
        }

        // If manual price is set, use it
        if ($this->sale_price > 0) {
            return $this->sale_price;
        }

        // Otherwise calculate from components
        return (float) $this->components()
            ->with('relatedProduct')
            ->get()
            ->sum(fn ($rel) => $rel->calculateQuantity(1) * $rel->relatedProduct->sale_price);
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
            $product = $component->product;

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
            if (empty($product->code)) {
                $count = Product::count() + 1;
                $product->code = 'PROD-'.str_pad($count, 5, '0', STR_PAD_LEFT);
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
}
