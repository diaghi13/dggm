<?php

namespace App\Data;

use App\Domains\Product\Data\ProductData;
use App\Domains\Warehouse\Data\WarehouseData;
use App\Enums\KitAssemblyStatus;
use App\Models\KitAssembly;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

class KitAssemblyData extends Data
{
    public function __construct(
        public int|Optional $id,

        public int $product_id,

        #[Max(255)]
        public string $name,

        public KitAssemblyStatus $status,

        public ?int $warehouse_id,

        #[Max(255)]
        public ?string $location,

        public ?string $notes,

        public ?string $assembled_at,
        public ?string $disassembled_at,
        public ?int $assembled_by_user_id,
        public ?int $disassembled_by_user_id,

        public string|Optional $created_at,
        public string|Optional $updated_at,

        public ProductData|Lazy|null $product = null,

        public WarehouseData|Lazy|null $warehouse = null,

        #[DataCollectionOf(KitAssemblyItemData::class)]
        public DataCollection|Lazy|null $items = null,
    ) {}

    public static function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:assembled,in_use,returned,disassembled'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public static function messages(): array
    {
        return [
            'product_id.required' => 'Il prodotto kit è obbligatorio.',
            'product_id.exists' => 'Il prodotto selezionato non esiste.',
            'name.required' => 'Il nome dell\'assembly è obbligatorio.',
            'name.max' => 'Il nome non può superare 255 caratteri.',
        ];
    }

    public static function fromModel(KitAssembly $assembly): self
    {
        return new self(
            id: $assembly->id,
            product_id: $assembly->product_id,
            name: $assembly->name,
            status: $assembly->status,
            warehouse_id: $assembly->warehouse_id,
            location: $assembly->location,
            notes: $assembly->notes,
            assembled_at: $assembly->assembled_at?->toIsoString(),
            disassembled_at: $assembly->disassembled_at?->toIsoString(),
            assembled_by_user_id: $assembly->assembled_by_user_id,
            disassembled_by_user_id: $assembly->disassembled_by_user_id,
            created_at: $assembly->created_at?->toIsoString() ?? '',
            updated_at: $assembly->updated_at?->toIsoString() ?? '',
            product: Lazy::whenLoaded('product', $assembly, fn () => ProductData::fromModel($assembly->product)),
            warehouse: Lazy::whenLoaded('warehouse', $assembly, fn () => WarehouseData::fromModel($assembly->warehouse)),
            items: Lazy::whenLoaded('items', $assembly, fn () => KitAssemblyItemData::collect($assembly->items)),
        );
    }
}
