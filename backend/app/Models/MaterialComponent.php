<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'kit_material_id',
        'component_material_id',
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
    public function kitMaterial(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'kit_material_id');
    }

    public function componentMaterial(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'component_material_id');
    }

    // Accessors
    public function getTotalCostAttribute(): float
    {
        return $this->quantity * ($this->componentMaterial->purchase_price ?? 0);
    }
}
