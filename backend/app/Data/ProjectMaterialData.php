<?php

namespace App\Data;

use App\Enums\ProjectMaterialStatus;
use App\Models\ProjectMaterial;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;

class ProjectMaterialData extends Data
{
    public function __construct(
        public ?int $id,
        public ?int $project_id,
        public ?int $product_id,
        public ?int $quote_item_id,
        public ?bool $is_extra,
        public ?int $requested_by,
        public ?string $requested_at,
        public ?string $extra_reason,
        public ?float $planned_quantity,
        public ?float $allocated_quantity,
        public ?float $delivered_quantity,
        public ?float $used_quantity,
        public ?float $returned_quantity,
        public ?float $planned_unit_cost,
        public ?float $actual_unit_cost,
        public ?ProjectMaterialStatus $status,
        public ?string $required_date,
        public ?string $delivery_date,
        public ?string $notes,

        public ?int $kit_assembly_id,
        public ?bool $is_rental,
        public ?array $subrental_assignments = null,

        // Computed properties (read-only, not stored directly)
        public readonly ?float $remaining_quantity = null,
        public readonly ?float $usage_percentage = null,
        public readonly ?float $planned_total_cost = null,
        public readonly ?float $actual_total_cost = null,
        public readonly ?float $cost_variance = null,

        // Product info (loaded from relationship)
        public readonly ?string $product_name = null,
        public readonly ?string $product_code = null,

        public ProductData|Lazy|null $product = null,
        public QuoteItemData|Lazy|null $quoteItem = null,
        public KitAssemblyData|Lazy|null $kit_assembly = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'quote_item_id' => ['nullable', 'integer', 'exists:quote_items,id'],
            'is_extra' => ['nullable', 'boolean'],
            'requested_by' => ['nullable', 'integer', 'exists:users,id'],
            'requested_at' => ['nullable', 'date'],
            'extra_reason' => ['nullable', 'string', 'max:255'],
            'planned_quantity' => ['nullable', 'numeric', 'min:0'],
            'allocated_quantity' => ['nullable', 'numeric', 'min:0'],
            'delivered_quantity' => ['nullable', 'numeric', 'min:0'],
            'used_quantity' => ['nullable', 'numeric', 'min:0'],
            'returned_quantity' => ['nullable', 'numeric', 'min:0'],
            'planned_unit_cost' => ['nullable', 'numeric', 'min:0'],
            'actual_unit_cost' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string'],
            'required_date' => ['nullable', 'date'],
            'delivery_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'kit_assembly_id' => ['nullable', 'integer', 'exists:kit_assemblies,id'],
            'is_rental' => ['nullable', 'boolean'],
            'subrental_assignments' => ['nullable', 'array'],
            'subrental_assignments.*.subrental_supplier_entry_id' => ['required', 'integer'],
            'subrental_assignments.*.quantity' => ['nullable', 'numeric', 'min:0'],
            'subrental_assignments.*.quoted_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public static function fromModel(ProjectMaterial $projectMaterial): self
    {
        return new self(
            id: $projectMaterial->id,
            project_id: $projectMaterial->project_id,
            product_id: $projectMaterial->product_id,
            quote_item_id: $projectMaterial->quote_item_id,
            is_extra: $projectMaterial->is_extra,
            requested_by: $projectMaterial->requested_by,
            requested_at: optional($projectMaterial->requested_at)->toDateTimeString(),
            extra_reason: $projectMaterial->extra_reason,
            planned_quantity: $projectMaterial->planned_quantity,
            allocated_quantity: $projectMaterial->allocated_quantity,
            delivered_quantity: $projectMaterial->delivered_quantity,
            used_quantity: $projectMaterial->used_quantity,
            returned_quantity: $projectMaterial->returned_quantity,
            planned_unit_cost: $projectMaterial->planned_unit_cost,
            actual_unit_cost: $projectMaterial->actual_unit_cost,
            status: $projectMaterial->status,
            required_date: optional($projectMaterial->required_date)->toDateString(),
            delivery_date: optional($projectMaterial->delivery_date)->toDateString(),
            notes: $projectMaterial->notes,

            kit_assembly_id: $projectMaterial->kit_assembly_id,
            is_rental: $projectMaterial->is_rental,
            subrental_assignments: $projectMaterial->subrental_assignments,

            // Computed properties
            remaining_quantity: $projectMaterial->planned_quantity - ($projectMaterial->used_quantity + $projectMaterial->returned_quantity),
            usage_percentage: $projectMaterial->planned_quantity > 0 ? (($projectMaterial->used_quantity + $projectMaterial->returned_quantity) / $projectMaterial->planned_quantity) * 100 : null,
            planned_total_cost: $projectMaterial->planned_unit_cost * $projectMaterial->planned_quantity,
            actual_total_cost: $projectMaterial->actual_unit_cost * ($projectMaterial->used_quantity + $projectMaterial->returned_quantity),
            cost_variance: ($projectMaterial->actual_unit_cost * ($projectMaterial->used_quantity + $projectMaterial->returned_quantity)) - ($projectMaterial->planned_unit_cost * $projectMaterial->planned_quantity),

            // Product info
            product_name: optional($projectMaterial->product)->name,
            product_code: optional($projectMaterial->product)->code,

            product: Lazy::whenLoaded('product', $projectMaterial, fn () => ProductData::fromModel($projectMaterial->product)),
            quoteItem: Lazy::whenLoaded('quoteItem', $projectMaterial, fn () => QuoteItemData::fromModel($projectMaterial->quoteItem)),
            kit_assembly: Lazy::whenLoaded('kitAssembly', $projectMaterial, fn () => KitAssemblyData::fromModel($projectMaterial->kitAssembly)),
        );
    }
}
