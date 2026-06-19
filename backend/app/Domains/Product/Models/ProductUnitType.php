<?php

namespace App\Domains\Product\Models;

use App\Domains\Product\Data\ProductUnitTypeData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\LaravelData\WithData;

/**
 * Product Unit Type Model
 *
 * Manages standardized measurement units (kg, m, pz, etc.)
 * with localization support (IT/EN) and supplier alias mapping.
 */
class ProductUnitType extends Model
{
    use HasFactory, WithData;

    protected string $dataClass = ProductUnitTypeData::class;

    protected $fillable = [
        'code',
        'name_it',
        'symbol_it',
        'name_en',
        'symbol_en',
        'aliases',
        'category',
        'conversion_factor',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'aliases' => 'array',
            'conversion_factor' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Products using this unit type
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'unit', 'code');
    }

    // ==================== SCOPES ====================

    /**
     * Scope to only active unit types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by category (weight, length, volume, etc.)
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get localized name based on current locale
     */
    public function getLocalizedName(): string
    {
        return app()->getLocale() === 'it' ? $this->name_it : $this->name_en;
    }

    /**
     * Get localized symbol based on current locale
     */
    public function getLocalizedSymbol(): string
    {
        return app()->getLocale() === 'it' ? $this->symbol_it : $this->symbol_en;
    }

    /**
     * Find unit type by code or alias (for supplier imports)
     *
     * Searches in order:
     * 1. Exact code match
     * 2. Symbol match (IT or EN)
     * 3. Alias match (JSON array)
     *
     * @param  string  $input  Unit string from supplier (e.g., "kg", "KG", "chilogrammi")
     * @return self|null Found unit type or null
     */
    public static function findByAlias(string $input): ?self
    {
        $normalized = strtolower(trim($input));

        // Try exact code match
        $unit = self::where('code', $normalized)->first();
        if ($unit) {
            return $unit;
        }

        // Try symbol IT/EN
        $unit = self::where('symbol_it', $normalized)
            ->orWhere('symbol_en', $normalized)
            ->first();
        if ($unit) {
            return $unit;
        }

        // Try aliases (JSON)
        return self::whereJsonContains('aliases', $normalized)->first();
    }
}
