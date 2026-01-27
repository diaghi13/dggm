<?php

namespace App\Models;

use App\Data\ProductComponentData;
use App\Enums\ProductType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\LaravelData\WithData;

class ProductComponent extends Model
{
    use WithData;

    protected $table = 'product_components';

    protected string $dataClass = ProductComponentData::class;

    protected $fillable = [
        'kit_product_id',
        'component_product_id',
        'quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    // Relationships
    public function kitProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'kit_product_id');
    }

    public function componentProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'component_product_id');
    }

    // Boot - Validation
    protected static function booted(): void
    {
        static::creating(function ($component) {
            $kitProduct = Product::find($component->kit_product_id);

            // Only COMPOSITE products can have components
            if ($kitProduct && $kitProduct->product_type !== ProductType::COMPOSITE) {
                throw new \Exception('Only COMPOSITE products can have components');
            }

            // All product types (ARTICLE, SERVICE, COMPOSITE) can BE components
            // This allows nested composite products
        });

        static::updating(function ($component) {
            // Prevent circular dependencies
            $kitProduct = Product::find($component->kit_product_id);
            $componentProduct = Product::find($component->component_product_id);

            if ($kitProduct && $componentProduct) {
                if ($component->wouldCreateCircularDependency($kitProduct, $componentProduct)) {
                    throw new \Exception('This would create a circular dependency');
                }
            }
        });
    }

    /**
     * Check if adding this component would create a circular dependency
     */
    protected function wouldCreateCircularDependency(Product $kit, Product $component): bool
    {
        // If component is not composite, no risk of circular dependency
        if ($component->product_type !== ProductType::COMPOSITE) {
            return false;
        }

        // Check if the kit product is already a component of the component product
        return $this->checkCircular($component, $kit->id);
    }

    /**
     * Recursively check for circular dependencies
     */
    protected function checkCircular(Product $product, int $targetId, array $visited = []): bool
    {
        if ($product->id === $targetId) {
            return true;
        }

        if (in_array($product->id, $visited)) {
            return false;
        }

        $visited[] = $product->id;

        foreach ($product->components as $component) {
            if ($this->checkCircular($component->componentProduct, $targetId, $visited)) {
                return true;
            }
        }

        return false;
    }
}
