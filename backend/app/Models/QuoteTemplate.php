<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuoteTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'logo_path',
        'primary_color',
        'secondary_color',
        'font_family',
        'font_size',
        'page_size',
        'orientation',
        'header_text',
        'footer_text',
        'show_logo',
        'show_page_numbers',
        'show_item_codes',
        'show_unit_column',
        'group_by_sections',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'show_logo' => 'boolean',
        'show_page_numbers' => 'boolean',
        'show_item_codes' => 'boolean',
        'show_unit_column' => 'boolean',
        'group_by_sections' => 'boolean',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'font_size' => 'integer',
    ];

    /**
     * Get quotes using this template
     */
    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class, 'template_id');
    }

    /**
     * Scope to get only active templates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get default template
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }
}
