<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'logo_path' => $this->logo_path,
            'primary_color' => $this->primary_color,
            'secondary_color' => $this->secondary_color,
            'font_family' => $this->font_family,
            'font_size' => $this->font_size,
            'page_size' => $this->page_size,
            'orientation' => $this->orientation,
            'header_text' => $this->header_text,
            'footer_text' => $this->footer_text,
            'show_logo' => $this->show_logo,
            'show_page_numbers' => $this->show_page_numbers,
            'show_item_codes' => $this->show_item_codes,
            'show_unit_column' => $this->show_unit_column,
            'group_by_sections' => $this->group_by_sections,
            'is_default' => $this->is_default,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
