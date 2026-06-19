<?php

namespace App\Domains\Product\Models;

use App\Domains\Product\Data\ProductBrandData;
use App\Domains\Product\Services\ProductBrandService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\LaravelData\WithData;

class ProductBrand extends Model
{
    use HasFactory, WithData;

    protected string $dataClass = ProductBrandData::class;

    protected $fillable = [
        'name',
        'code',
        'description',
        'logo_url',
        'website',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'brand_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Boot
    protected static function booted(): void
    {
        static::creating(function ($brand) {
            if (empty($brand->code)) {
                $brand->code = ProductBrandService::generateUniqueCode($brand->name);
            }
        });
    }
}
