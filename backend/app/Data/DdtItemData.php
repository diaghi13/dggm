<?php

namespace App\Data;

use App\Models\DdtItem;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * DDT Item Data Transfer Object
 *
 * Represents a single item (product) in a DDT document.
 */
#[TypeScript]
class DdtItemData extends Data
{
    public function __construct(
        // Primary
        public int|Optional $id,

        #[Exists('ddts', 'id')]
        public int|Optional|null $ddt_id,

        #[Required, Exists('products', 'id')]
        public int $product_id,

        #[Required, Min(0.01)]
        public float $quantity,

        #[Required, Max(20)]
        public string $unit,

        #[Min(0)]
        public ?float $unit_cost,

        public ?string $notes,

        // Timestamps
        public string|Optional $created_at,
        public string|Optional $updated_at,

        // Lazy relationships
        public Lazy|ProductData|null $product = null,

        // Computed properties
        #[Computed]
        public float $total_cost = 0,
    ) {}

    /**
     * Create from DdtItem model
     */
    public static function fromModel(DdtItem $item): self
    {
        return new self(
            id: $item->id,
            ddt_id: $item->ddt_id,
            product_id: $item->product_id,
            quantity: $item->quantity,
            unit: $item->unit,
            unit_cost: $item->unit_cost,
            notes: $item->notes,
            created_at: $item->created_at->toISOString(),
            updated_at: $item->updated_at->toISOString(),
            product: Lazy::whenLoaded('product', $item, fn () => ProductData::from($item->product)),
            total_cost: $item->total_cost,
        );
    }

    /**
     * Calculate total cost
     */
    public function calculateTotalCost(): float
    {
        return $this->quantity * ($this->unit_cost ?? 0);
    }

    /**
     * Validation messages
     */
    public static function messages(): array
    {
        return [
            'ddt_id.required' => 'Il DDT è obbligatorio.',
            'ddt_id.exists' => 'Il DDT selezionato non esiste.',
            'product_id.required' => 'Il prodotto è obbligatorio.',
            'product_id.exists' => 'Il prodotto selezionato non esiste.',
            'quantity.required' => 'La quantità è obbligatoria.',
            'quantity.min' => 'La quantità deve essere maggiore di zero.',
            'unit.required' => 'L\'unità di misura è obbligatoria.',
            'unit.max' => 'L\'unità di misura non può superare i 20 caratteri.',
            'unit_cost.min' => 'Il costo unitario non può essere negativo.',
        ];
    }
}
