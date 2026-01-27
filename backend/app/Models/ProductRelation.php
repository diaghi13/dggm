<?php

namespace App\Models;

use App\Enums\ProductRelationQuantityType;
use App\Enums\ProductType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductRelation extends Model
{
    protected $fillable = [
        'product_id',
        'related_product_id',
        'relation_type_id',
        'quantity_type',
        'quantity_value',
        'is_visible_in_quote',
        'is_visible_in_material_list',
        'is_required_for_stock',
        'is_optional',
        'min_quantity_trigger',
        'max_quantity_trigger',
        'sort_order',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'product_id' => 'integer',
            'related_product_id' => 'integer',
            'relation_type_id' => 'integer',
            'quantity_value' => 'string',
            'is_visible_in_quote' => 'boolean',
            'is_visible_in_material_list' => 'boolean',
            'is_required_for_stock' => 'boolean',
            'is_optional' => 'boolean',
            'min_quantity_trigger' => 'decimal:2',
            'max_quantity_trigger' => 'decimal:2',
            'sort_order' => 'integer',
            'quantity_type' => ProductRelationQuantityType::class,
        ];
    }

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function relatedProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'related_product_id');
    }

    public function relationType(): BelongsTo
    {
        return $this->belongsTo(ProductRelationType::class, 'relation_type_id');
    }

    // Scopes
    public function scopeComponents($query)
    {
        return $query->whereHas('relationType', fn ($q) => $q->where('code', 'component'));
    }

    public function scopeDependencies($query)
    {
        return $query->whereHas('relationType', fn ($q) => $q->where('code', '!=', 'component'));
    }

    public function scopeVisibleInQuote($query)
    {
        return $query->where('is_visible_in_quote', true);
    }

    public function scopeVisibleInMaterialList($query)
    {
        return $query->where('is_visible_in_material_list', true);
    }

    public function scopeRequiredForStock($query)
    {
        return $query->where('is_required_for_stock', true);
    }

    public function scopeByRelationType($query, int $relationTypeId)
    {
        return $query->where('relation_type_id', $relationTypeId);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }

    // Business Logic
    public function calculateQuantity(float $parentQuantity): float
    {
        // Check triggers
        if (! $this->shouldApply($parentQuantity)) {
            return 0;
        }

        // Use ENUM directly
        return match ($this->quantity_type) {
            ProductRelationQuantityType::FIXED => (float) $this->quantity_value,
            ProductRelationQuantityType::MULTIPLIED => $parentQuantity * (float) $this->quantity_value,
            ProductRelationQuantityType::FORMULA => $this->evaluateFormula($parentQuantity),
            default => 0,
        };
    }

    public function shouldApply(float $quantity): bool
    {
        if ($this->min_quantity_trigger && $quantity < $this->min_quantity_trigger) {
            return false;
        }

        if ($this->max_quantity_trigger && $quantity > $this->max_quantity_trigger) {
            return false;
        }

        return true;
    }

    protected function evaluateFormula(float $qty): float
    {
        $formula = $this->quantity_value;
        $formula = str_replace('qty', $qty, $formula);

        // Validate safe formula (only allow math operations and safe functions)
        if (! preg_match('/^[0-9+\-*\/().,\s]+$|ceil|floor|round|min|max/', $formula)) {
            \Log::error("Invalid formula: {$formula}");

            return 0;
        }

        try {
            $result = eval("return $formula;");

            return (float) $result;
        } catch (\Throwable $e) {
            \Log::error("Formula evaluation failed: {$formula}", ['error' => $e->getMessage()]);

            return 0;
        }
    }

    // Validation
    protected static function booted(): void
    {
        static::creating(function ($relation) {
            // Only COMPOSITE products can have 'component' relations
            $relationType = ProductRelationType::find($relation->relation_type_id);
            if ($relationType && $relationType->code === 'component') {
                $product = Product::find($relation->product_id);
                if ($product && $product->product_type !== ProductType::COMPOSITE) {
                    throw new \Exception('Only COMPOSITE products can have components');
                }
            }

            // Prevent self-reference
            if ($relation->product_id === $relation->related_product_id) {
                throw new \Exception('A product cannot be related to itself');
            }
        });

        static::updating(function ($relation) {
            // Check circular dependencies for components
            $relationType = ProductRelationType::find($relation->relation_type_id);
            if ($relationType && $relationType->code === 'component') {
                if ($relation->wouldCreateCircularDependency()) {
                    throw new \Exception('This would create a circular dependency');
                }
            }
        });
    }

    protected function wouldCreateCircularDependency(): bool
    {
        $product = Product::find($this->product_id);
        $relatedProduct = Product::find($this->related_product_id);

        if (! $product || ! $relatedProduct) {
            return false;
        }

        return $this->checkCircular($relatedProduct, $product->id);
    }

    protected function checkCircular(Product $product, int $targetId, array $visited = []): bool
    {
        if ($product->id === $targetId) {
            return true;
        }

        if (in_array($product->id, $visited)) {
            return false;
        }

        $visited[] = $product->id;

        $relations = $product->relations()->components()->with('relatedProduct')->get();

        foreach ($relations as $relation) {
            if ($this->checkCircular($relation->relatedProduct, $targetId, $visited)) {
                return true;
            }
        }

        return false;
    }
}
