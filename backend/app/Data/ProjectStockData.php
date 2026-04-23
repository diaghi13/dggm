<?php

namespace App\Data;

use App\Models\ProjectMaterial;
use Spatie\LaravelData\Data;

class ProjectStockData extends Data
{
    public function __construct(
        public int $project_material_id,
        public int $product_id,
        public string $product_name,
        public string $product_code,
        public ?string $unit,
        public bool $is_rentable,
        public bool $is_consumable,
        public float $project_stock,
        public float $delivered_quantity,
        public float $used_quantity,
        public float $returned_quantity,
        public ?string $required_return_date,
    ) {}

    public static function fromModel(ProjectMaterial $material): self
    {
        return new self(
            project_material_id: $material->id,
            product_id: $material->product_id,
            product_name: $material->product?->name ?? '',
            product_code: $material->product?->code ?? '',
            unit: $material->product?->unit,
            is_rentable: (bool) ($material->product?->is_rentable ?? false),
            is_consumable: (bool) ($material->is_consumable ?? false),
            project_stock: (float) ($material->project_stock ?? 0),
            delivered_quantity: (float) ($material->delivered_quantity ?? 0),
            used_quantity: (float) ($material->used_quantity ?? 0),
            returned_quantity: (float) ($material->returned_quantity ?? 0),
            required_return_date: $material->required_date?->toDateString(),
        );
    }
}
