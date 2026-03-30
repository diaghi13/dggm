<?php

namespace App\Data;

use App\Models\KitAssemblyItem;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

class KitAssemblyItemData extends Data
{
    public function __construct(
        public int|Optional $id,

        public int $kit_assembly_id,

        public int $product_id,

        #[Min(0)]
        public float $quantity,

        #[Max(100)]
        public ?string $serial_number,

        public ?string $notes,

        public string|Optional $created_at,
        public string|Optional $updated_at,

        public ProductData|Lazy|null $product = null,
    ) {}

    public static function rules(): array
    {
        return [
            'kit_assembly_id' => ['required', 'integer', 'exists:kit_assemblies,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public static function fromModel(KitAssemblyItem $item): self
    {
        return new self(
            id: $item->id,
            kit_assembly_id: $item->kit_assembly_id,
            product_id: $item->product_id,
            quantity: (float) $item->quantity,
            serial_number: $item->serial_number,
            notes: $item->notes,
            created_at: $item->created_at?->toIsoString() ?? '',
            updated_at: $item->updated_at?->toIsoString() ?? '',
            product: Lazy::whenLoaded('product', $item, fn () => ProductData::fromModel($item->product)),
        );
    }
}
