<?php

namespace App\Data;

use App\Enums\ProductRelationQuantityType;
use App\Models\ProductRelation;
use Spatie\LaravelData\Attributes\FromRouteParameter;
use Spatie\LaravelData\Attributes\FromRouteParameterProperty;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;

/**
 * ProductRelationData DTO
 *
 * Relazioni tra prodotti (componenti, dipendenze, accessori, etc.)
 */
class ProductRelationData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required]
        public int $product_id,

        #[Required]
        public int $related_product_id,

        #[Required]
        public int $relation_type_id,

        #[Required]
        public ProductRelationQuantityType $quantity_type,

        #[Required]
        public string $quantity_value,

        #[BooleanType]
        public bool $is_visible_in_quote = false,

        #[BooleanType]
        public bool $is_visible_in_material_list = true,

        #[BooleanType]
        public bool $is_required_for_stock = true,

        #[BooleanType]
        public bool $is_optional = false,

        #[Nullable]
        public ?float $min_quantity_trigger = 0,

        #[Nullable]
        public ?float $max_quantity_trigger = 0,

        public ?int $sort_order = 1,

        #[Nullable]
        public ?string $notes,

        // Relationships (Lazy loaded)
        //public readonly Lazy|ProductData|null $product,
        public readonly Lazy|ProductData|null $relatedProduct,
        public readonly Lazy|ProductRelationTypeData|null $relationType,
    ) {
        $this->sort_order = $this->sort_order ?? 1;
    }

//    public static function fromRequest(array $data): self
//    {
//        return self::from([
//            ...$data,
//            'quantity_type' => $data['quantity_type'] ?? ProductRelationQuantityType::FIXED,
//            'quantity_value' => $data['quantity_value'] ?? '1',
//            'is_visible_in_quote' => $data['is_visible_in_quote'] ?? false,
//            'is_visible_in_material_list' => $data['is_visible_in_material_list'] ?? true,
//            'is_required_for_stock' => $data['is_required_for_stock'] ?? true,
//            'is_optional' => $data['is_optional'] ?? false,
//            'sort_order' => $data['sort_order'] ?? 0,
//            // Initialize Lazy relationships as null to avoid constructor errors
//            'relatedProduct' => Lazy::create(fn () => null),
//            'relationType' => Lazy::create(fn () => null),
//        ]);
//    }

    public static function fromModel(ProductRelation $relation): self
    {
        return new self(
            id: $relation->id,
            product_id: $relation->product_id,
            related_product_id: $relation->related_product_id,
            relation_type_id: $relation->relation_type_id,
            quantity_type: $relation->quantity_type,
            quantity_value: $relation->quantity_value,
            is_visible_in_quote: $relation->is_visible_in_quote,
            is_visible_in_material_list: $relation->is_visible_in_material_list,
            is_required_for_stock: $relation->is_required_for_stock,
            is_optional: $relation->is_optional,
            min_quantity_trigger: $relation->min_quantity_trigger,
            max_quantity_trigger: $relation->max_quantity_trigger,
            sort_order: $relation->sort_order,
            notes: $relation->notes,
            //product: Lazy::whenLoaded('product', $relation, fn () => ProductData::from($relation->product)),
            relatedProduct: Lazy::whenLoaded('relatedProduct', $relation, fn () => ProductData::from($relation->relatedProduct)),
            relationType: Lazy::whenLoaded('relationType', $relation, fn () => ProductRelationTypeData::from($relation->relationType)),
        );
    }
}
