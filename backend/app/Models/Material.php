<?php

namespace App\Models;

use App\Enums\MaterialType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'product_type',
        'is_kit',
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
            'product_type' => MaterialType::class,
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
            'is_kit' => 'boolean',
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
        return $this->hasMany(Inventory::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function siteAssignments(): HasMany
    {
        return $this->hasMany(SiteMaterial::class);
    }

    // Kit/Composition relationships
    public function components(): HasMany
    {
        return $this->hasMany(MaterialComponent::class, 'kit_material_id');
    }

    public function usedInKits(): HasMany
    {
        return $this->hasMany(MaterialComponent::class, 'component_material_id');
    }

    // Material Dependencies relationships
    public function dependencies(): HasMany
    {
        return $this->hasMany(MaterialDependency::class, 'material_id');
    }

    public function usedAsDependency(): HasMany
    {
        return $this->hasMany(MaterialDependency::class, 'dependency_material_id');
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

    public function scopeByProductType($query, MaterialType $type)
    {
        return $query->where('product_type', $type);
    }

    public function scopeRentable($query)
    {
        return $query->where('is_rentable', true);
    }

    public function scopeKits($query)
    {
        return $query->where('is_kit', true);
    }

    public function scopePhysical($query)
    {
        return $query->where('product_type', MaterialType::PHYSICAL);
    }

    public function scopeServices($query)
    {
        return $query->where('product_type', MaterialType::SERVICE);
    }

    // Accessors
    public function getTotalStockAttribute(): float
    {
        return (float) $this->inventory()->sum('quantity_available');
    }

    public function getTotalReservedAttribute(): float
    {
        return (float) $this->inventory()->sum('quantity_reserved');
    }

    public function getAvailableStockAttribute(): float
    {
        return $this->total_stock - $this->total_reserved - $this->quantity_out_on_rental;
    }

    public function getCalculatedSalePriceAttribute(): float
    {
        if ($this->markup_percentage > 0) {
            return $this->purchase_price * (1 + ($this->markup_percentage / 100));
        }

        return $this->sale_price;
    }

    public function getKitTotalCostAttribute(): float
    {
        if (! $this->is_kit) {
            return 0;
        }

        return (float) $this->components()->with('componentMaterial')
            ->get()
            ->sum(fn ($component) => $component->quantity * $component->componentMaterial->purchase_price);
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
     * Calculate all dependencies for a given quantity
     *
     * @return array [['material_id' => int, 'material' => Material, 'quantity' => float, 'dependency' => MaterialDependency], ...]
     */
    public function calculateDependencies(float $quantity): array
    {
        $dependencies = $this->dependencies()
            ->with('dependencyMaterial')
            ->get();

        $result = [];

        foreach ($dependencies as $dependency) {
            if (! $dependency->shouldApply($quantity)) {
                continue;
            }

            $calculatedQty = $dependency->calculateQuantity($quantity);

            if ($calculatedQty > 0) {
                $result[] = [
                    'material_id' => $dependency->dependency_material_id,
                    'material' => $dependency->dependencyMaterial,
                    'quantity' => $calculatedQty,
                    'dependency' => $dependency,
                ];
            }
        }

        return $result;
    }

    // Boot
    protected static function booted(): void
    {
        static::creating(function ($material) {
            if (empty($material->code)) {
                $count = Material::count() + 1;
                $material->code = 'MAT-'.str_pad($count, 5, '0', STR_PAD_LEFT);
            }
        });
    }
}
