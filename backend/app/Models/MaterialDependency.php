<?php

namespace App\Models;

use App\Enums\DependencyType;
use App\Enums\QuantityCalculationType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialDependency extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_id',
        'dependency_material_id',
        'dependency_type',
        'quantity_type',
        'quantity_value',
        'is_visible_in_quote',
        'is_required_for_stock',
        'is_optional',
        'min_quantity_trigger',
        'max_quantity_trigger',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'dependency_type' => DependencyType::class,
            'quantity_type' => QuantityCalculationType::class,
            'is_visible_in_quote' => 'boolean',
            'is_required_for_stock' => 'boolean',
            'is_optional' => 'boolean',
            'min_quantity_trigger' => 'decimal:2',
            'max_quantity_trigger' => 'decimal:2',
        ];
    }

    // Relationships
    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'material_id');
    }

    public function dependencyMaterial(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'dependency_material_id');
    }

    // Business methods
    public function calculateQuantity(float $parentQuantity): float
    {
        // Check if triggers apply
        if ($this->min_quantity_trigger && $parentQuantity < $this->min_quantity_trigger) {
            return 0;
        }

        if ($this->max_quantity_trigger && $parentQuantity > $this->max_quantity_trigger) {
            return 0;
        }

        return match ($this->quantity_type) {
            QuantityCalculationType::Fixed => (float) $this->quantity_value,
            QuantityCalculationType::Ratio => $parentQuantity * (float) $this->quantity_value,
            QuantityCalculationType::Formula => $this->evaluateFormula($parentQuantity),
        };
    }

    protected function evaluateFormula(float $qty): float
    {
        $formula = $this->quantity_value;

        // Replace 'qty' with actual value
        $formula = str_replace('qty', $qty, $formula);

        // Evaluate safe formulas (ceil, floor, round, basic math)
        try {
            // Allow only safe functions
            if (! preg_match('/^[0-9+\-*\/().,\s]+$|ceil|floor|round|min|max/', $formula)) {
                throw new \Exception('Invalid formula characters');
            }

            // Evaluate using eval (safe because we validated the formula)
            $result = eval("return $formula;");

            return (float) $result;
        } catch (\Throwable $e) {
            \Log::error("Formula evaluation failed: {$formula}", ['error' => $e->getMessage()]);

            return 0;
        }
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
}
