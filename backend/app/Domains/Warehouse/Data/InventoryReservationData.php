<?php

namespace App\Domains\Warehouse\Data;

use App\Domains\Warehouse\Models\InventoryReservation;
use App\Enums\InventoryReservationStatus;
use App\Enums\InventoryReservationType;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class InventoryReservationData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Exists('products', 'id')]
        public int $product_id,

        #[Exists('warehouses', 'id')]
        public ?int $warehouse_id,

        #[Required, Min(0.01)]
        public float $quantity,

        #[Required]
        public string $start_date,

        public ?string $end_date,

        #[Required]
        public InventoryReservationType $type,

        public ?string $reference_type,
        public ?int $reference_id,

        #[Required]
        public InventoryReservationStatus $status,

        public ?string $notes,

        public string|Optional $created_at,
        public string|Optional $updated_at,

        public Lazy|WarehouseData|null $warehouse = null,
    ) {}

    public static function fromModel(InventoryReservation $reservation): self
    {
        return new self(
            id: $reservation->id,
            product_id: $reservation->product_id,
            warehouse_id: $reservation->warehouse_id,
            quantity: (float) $reservation->quantity,
            start_date: $reservation->start_date->toDateString(),
            end_date: $reservation->end_date?->toDateString(),
            type: $reservation->type,
            reference_type: $reservation->reference_type,
            reference_id: $reservation->reference_id,
            status: $reservation->status,
            notes: $reservation->notes,
            created_at: $reservation->created_at->toISOString(),
            updated_at: $reservation->updated_at->toISOString(),
            warehouse: Lazy::whenLoaded('warehouse', $reservation, fn () => WarehouseData::from($reservation->warehouse)),
        );
    }

    public static function messages(): array
    {
        return [
            'product_id.required' => 'Il prodotto è obbligatorio.',
            'product_id.exists' => 'Il prodotto selezionato non esiste.',
            'warehouse_id.exists' => 'Il magazzino selezionato non esiste.',
            'quantity.required' => 'La quantità è obbligatoria.',
            'quantity.min' => 'La quantità deve essere maggiore di zero.',
            'start_date.required' => 'La data di inizio è obbligatoria.',
            'type.required' => 'Il tipo di prenotazione è obbligatorio.',
            'status.required' => 'Lo stato è obbligatorio.',
        ];
    }
}
