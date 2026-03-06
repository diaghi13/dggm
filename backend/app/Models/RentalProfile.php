<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RentalProfile extends Model
{
    protected $fillable = [
        'name',
        'sector',
        'exponent_curve',
        'decay_strength',
        'max_duration_reference',
        'duration_offset',
        'max_period_cap_days',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'exponent_curve' => 'decimal:4',
            'decay_strength' => 'decimal:4',
            'max_duration_reference' => 'decimal:2',
            'duration_offset' => 'decimal:4',
            'max_period_cap_days' => 'decimal:2',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function productCategories(): HasMany
    {
        return $this->hasMany(ProductCategory::class);
    }
}
