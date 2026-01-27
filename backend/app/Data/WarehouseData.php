<?php

namespace App\Data;

use App\Enums\WarehouseType;
use App\Models\Warehouse;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Lazy;

/**
 * WarehouseData DTO
 *
 * Questo DTO usa Spatie Laravel Data per:
 * - Validazione automatica
 * - Type safety
 * - Trasformazione da/verso array, JSON, Eloquent
 */
class WarehouseData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required, Max(50)]
        public string $code,

        #[Required, Max(255)]
        public string $name,

        #[Required]
        public WarehouseType $type,

        #[Nullable, Max(255)]
        public ?string $address,

        #[Nullable, Max(100)]
        public ?string $city,

        #[Nullable, Max(2)]
        public ?string $province,

        #[Nullable, Max(10)]
        public ?string $postal_code,

        #[Nullable]
        public ?int $manager_id,

        #[Nullable]
        public ?string $notes,

        #[BooleanType]
        public bool $is_active,

        // Computed properties (non salvati nel DB)
        public readonly ?string $full_address,
        public readonly ?float $total_value,

        // Relationships
        public readonly Lazy|UserData|null $manager,
    ) {}

    /**
     * Crea il DTO da un array con valori di default
     */
    public static function fromRequest(array $data): self
    {
        return self::from([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public static function fromModel(Warehouse $warehouse): WarehouseData
    {
        return new self(
            id: $warehouse->id,
            code: $warehouse->code,
            name: $warehouse->name,
            type: $warehouse->type,
            address: $warehouse->address,
            city: $warehouse->city,
            province: $warehouse->province,
            postal_code: $warehouse->postal_code,
            manager_id: $warehouse->manager_id,
            notes: $warehouse->notes,
            is_active: $warehouse->is_active,
            full_address: $warehouse->full_address,
            total_value: $warehouse->total_value,
            manager: Lazy::whenLoaded('manager', $warehouse, fn () => UserData::from($warehouse->manager)),
        );
    }
}
