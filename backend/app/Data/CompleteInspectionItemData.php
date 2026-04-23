<?php

namespace App\Data;

use App\Enums\InspectionItemAction;
use App\Enums\ItemCondition;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class CompleteInspectionItemData extends Data
{
    public function __construct(
        #[Required]
        public ItemCondition $condition,

        #[Required, Numeric, Min(0)]
        public float $quantity_good,

        #[Required, Numeric, Min(0)]
        public float $quantity_damaged,

        #[Required, Numeric, Min(0)]
        public float $quantity_write_off,

        #[Required]
        public InspectionItemAction $action,

        #[Required]
        public int $warehouse_id,

        #[Nullable]
        public ?string $damage_description,

        #[Nullable, Numeric, Min(0)]
        public ?float $repair_estimate,
    ) {}

    public static function rules(): array
    {
        return [
            'condition' => ['required', 'string', 'in:good,minor_damage,major_damage,write_off'],
            'quantity_good' => ['required', 'numeric', 'min:0'],
            'quantity_damaged' => ['required', 'numeric', 'min:0'],
            'quantity_write_off' => ['required', 'numeric', 'min:0'],
            'action' => ['required', 'string', 'in:return_to_stock,quarantine,write_off'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'damage_description' => ['nullable', 'string', 'max:2000'],
            'repair_estimate' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
