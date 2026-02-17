<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WarrantyType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'years',
        'description',
        'exclusions',
        'is_default',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'years' => 'integer',
            'exclusions' => 'array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Quotes using this warranty type
     */
    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class, 'warranty_type_id');
    }

    // ==================== SCOPES ====================

    /**
     * Scope to only active warranty types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to default warranty type
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope to order by sort_order and name
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // ==================== STATIC METHODS ====================

    /**
     * Get default warranty type
     */
    public static function getDefault(): ?self
    {
        return self::default()->active()->first();
    }

    // ==================== BOOT ====================

    /**
     * Boot model events
     *
     * Ensure only one warranty type is marked as default
     */
    protected static function booted(): void
    {
        static::saving(function ($warrantyType) {
            if ($warrantyType->is_default) {
                // Set all other warranty types to non-default
                static::where('id', '!=', $warrantyType->id)
                    ->update(['is_default' => false]);
            }
        });
    }
}
